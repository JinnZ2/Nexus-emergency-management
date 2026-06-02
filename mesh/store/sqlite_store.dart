import 'dart:convert';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';
import 'observation_store.dart';
import '../models/observation.dart';

/// SQLite-backed store for desktop / Raspberry Pi / always-on community node.
///
/// Schema choices that enforce the spine:
///   - PRIMARY KEY is `id` (the content hash) -> the database itself refuses
///     duplicate content. dedup is structural, not just code-level.
///   - Transit columns (is_carried, hop_count, received_at, expires_at) are
///     SEPARATE from content columns. improveTransit() updates only these.
///   - json_blob stores the full wire form for faithful reconstruction, but
///     the indexed/queried columns are the source of truth for dedup + carry.
class SqliteStore implements ObservationStore {
  Database? _db;
  final String dbPath;

  SqliteStore(this.dbPath);

  @override
  Future<void> init() async {
    sqfliteFfiInit();
    _db = await databaseFactoryFfi.openDatabase(dbPath);
    await _db!.execute('''
      CREATE TABLE IF NOT EXISTS observations (
        id TEXT PRIMARY KEY,            -- content hash; dedup pivot
        previous_id TEXT NOT NULL,
        pseudonym TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        lat REAL NOT NULL,
        lon REAL NOT NULL,
        altitude REAL,
        property TEXT NOT NULL,
        value TEXT NOT NULL,
        unit TEXT,
        vantage_type TEXT NOT NULL,
        vantage_lat REAL,
        vantage_lon REAL,
        vantage_description TEXT,
        inference TEXT,
        author_key TEXT,               -- authorship (optional)
        signature TEXT,
        is_carried INTEGER NOT NULL DEFAULT 0,   -- transit (local view)
        origin_pseudonym TEXT,
        hop_count INTEGER NOT NULL DEFAULT 0,
        received_at TEXT,
        expires_at TEXT,
        json_blob TEXT NOT NULL
      )
    ''');
    // Carry queries filter on these constantly; index them.
    await _db!.execute(
        'CREATE INDEX IF NOT EXISTS idx_carried ON observations(is_carried, hop_count, expires_at)');
    await _db!.execute(
        'CREATE INDEX IF NOT EXISTS idx_author ON observations(author_key, timestamp)');
  }

  @override
  Future<bool> add(Observation obs) async {
    // exists() check is belt-and-suspenders; the PK also guards.
    if (await exists(obs.id)) {
      // Known content. Maybe this arrival took a shorter route — let transit
      // improve, but report NOT-new so we don't re-flood.
      await improveTransit(obs);
      return false;
    }
    await _db!.insert(
      'observations',
      _toRow(obs),
      conflictAlgorithm: ConflictAlgorithm.ignore, // PK race -> treat as known
    );
    return true;
  }

  @override
  Future<bool> exists(String id) async {
    final rows = await _db!.query(
      'observations',
      columns: ['id'],
      where: 'id = ?',
      whereArgs: [id],
      limit: 1,
    );
    return rows.isNotEmpty;
  }

  @override
  Future<List<Observation>> getAll() async {
    final rows = await _db!.query('observations', orderBy: 'timestamp DESC');
    return rows.map(_fromRow).toList();
  }

  @override
  Future<List<Observation>> getLocalObservations() async {
    final rows = await _db!.query(
      'observations',
      where: 'is_carried = 0',
      orderBy: 'timestamp DESC',
    );
    return rows.map(_fromRow).toList();
  }

  @override
  Future<List<Observation>> getCarriedObservations({int maxHopCount = 5}) async {
    final now = DateTime.now().toUtc().toIso8601String();
    final rows = await _db!.query(
      'observations',
      where:
          'is_carried = 1 AND hop_count < ? AND (expires_at IS NULL OR expires_at > ?)',
      whereArgs: [maxHopCount, now],
    );
    return rows.map(_fromRow).toList();
  }

  @override
  Future<int> getCarriedCount() async {
    final now = DateTime.now().toUtc().toIso8601String();
    final result = await _db!.rawQuery(
      'SELECT COUNT(*) AS cnt FROM observations '
      'WHERE is_carried = 1 AND (expires_at IS NULL OR expires_at > ?)',
      [now],
    );
    return Sqflite.firstIntValue(result) ?? 0;
  }

  @override
  Future<String> lastLocalId(String localPseudonym) async {
    final rows = await _db!.query(
      'observations',
      columns: ['id'],
      where: 'is_carried = 0 AND pseudonym = ?',
      whereArgs: [localPseudonym],
      orderBy: 'timestamp DESC',
      limit: 1,
    );
    if (rows.isEmpty) return 'genesis';
    return rows.first['id'] as String;
  }

  @override
  Future<void> improveTransit(Observation obs) async {
    final rows = await _db!.query(
      'observations',
      columns: ['hop_count'],
      where: 'id = ?',
      whereArgs: [obs.id],
      limit: 1,
    );
    if (rows.isEmpty) return;
    final storedHop = rows.first['hop_count'] as int;
    if (obs.hopCount < storedHop) {
      await _db!.update(
        'observations',
        {
          'hop_count': obs.hopCount,
          'received_at': (obs.receivedAt ?? DateTime.now().toUtc())
              .toUtc()
              .toIso8601String(),
        },
        where: 'id = ?',
        whereArgs: [obs.id],
      );
    }
  }

  @override
  Future<int> pruneExpired() async {
    final now = DateTime.now().toUtc().toIso8601String();
    return await _db!.delete(
      'observations',
      where: 'is_carried = 1 AND expires_at IS NOT NULL AND expires_at <= ?',
      whereArgs: [now],
    );
  }

  @override
  Future<void> close() async {
    await _db?.close();
    _db = null;
  }

  // ---- row mapping ----

  Map<String, dynamic> _toRow(Observation o) => {
        'id': o.id,
        'previous_id': o.previousId,
        'pseudonym': o.pseudonym,
        'timestamp': o.timestamp.toUtc().toIso8601String(),
        'lat': o.lat,
        'lon': o.lon,
        'altitude': o.altitude,
        'property': o.property,
        'value': o.value,
        'unit': o.unit,
        'vantage_type': o.vantageType,
        'vantage_lat': o.vantageLat,
        'vantage_lon': o.vantageLon,
        'vantage_description': o.vantageDescription,
        'inference': o.inference,
        'author_key': o.authorKey,
        'signature': o.signature,
        'is_carried': o.isCarried ? 1 : 0,
        'origin_pseudonym': o.originPseudonym,
        'hop_count': o.hopCount,
        'received_at': o.receivedAt?.toUtc().toIso8601String(),
        'expires_at': o.expiresAt?.toUtc().toIso8601String(),
        'json_blob': jsonEncode(o.toJson()),
      };

  // Reconstruct from the canonical wire blob so the rebuilt object recomputes
  // its own id and matches exactly. Indexed columns are for querying; the blob
  // is the faithful record.
  Observation _fromRow(Map<String, dynamic> row) {
    return Observation.fromJson(jsonDecode(row['json_blob'] as String));
  }
}
