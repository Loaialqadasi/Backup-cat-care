import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { db } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/database.js';
import { DatabaseError } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/errors.js';
import { escapeLike } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/utils.js';
import { Cat, CatHealthStatus, CreateCatInput } from './cats.types.js';

interface CatRow extends RowDataPacket {
  id: number;
  nickname: string;
  description: string | null;
  photo_url: string | null;
  location_name: string;
  latitude: number | null;
  longitude: number | null;
  health_status: CatHealthStatus;
  ownership_tag: string;
  created_by_user_id: number | null;
  created_at: string;
  updated_at: string;
}

const mapCat = (row: CatRow): Cat => ({
  id: row.id,
  nickname: row.nickname,
  description: row.description,
  photoUrl: row.photo_url,
  locationName: row.location_name,
  latitude: row.latitude,
  longitude: row.longitude,
  healthStatus: row.health_status,
  ownershipTag: row.ownership_tag as Cat['ownershipTag'],
  createdByUserId: row.created_by_user_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

// build WHERE clause on the fly depending on what filters are active
const buildWhereClause = (
  search: string | undefined,
  healthStatus: CatHealthStatus | undefined,
  params: Array<string | number>
): string => {
  const conditions: string[] = [];
  if (healthStatus) {
    conditions.push('health_status = ?');
    params.push(healthStatus);
  }
  if (search) {
    const like = `%${escapeLike(search)}%`;
    conditions.push("(nickname LIKE ? ESCAPE '\\\\' OR location_name LIKE ? ESCAPE '\\\\')");
    params.push(like, like);
  }
  return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
};

export const catsRepository = {
  async create(input: CreateCatInput): Promise<Cat> {
    const [result] = await db.execute<ResultSetHeader>(
      'INSERT INTO cats (nickname, description, photo_url, location_name, latitude, longitude, health_status, ownership_tag, created_by_user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        input.nickname,
        input.description ?? null,
        input.photoUrl ?? null,
        input.locationName,
        input.latitude ?? null,
        input.longitude ?? null,
        input.healthStatus,
        input.ownershipTag,
        input.createdByUserId
      ]
    );
    const created = await this.findById(result.insertId);
    if (!created) {
      throw new DatabaseError('Failed to load created cat');
    }
    return created;
  },

  async findById(id: number): Promise<Cat | null> {
    const [rows] = await db.execute<CatRow[]>(
      'SELECT id, nickname, description, photo_url, location_name, latitude, longitude, health_status, ownership_tag, created_by_user_id, created_at, updated_at FROM cats WHERE id = ? LIMIT 1',
      [id]
    );
    if (rows.length === 0) {
      return null;
    }
    return mapCat(rows[0]);
  },

  // used by emergencies module to check if a cat exists before linking
  async existsById(id: number): Promise<boolean> {
    const [rows] = await db.execute<RowDataPacket[]>('SELECT id FROM cats WHERE id = ? LIMIT 1', [id]);
    return rows.length > 0;
  },

  async list(search?: string, healthStatus?: CatHealthStatus, limit = 10, offset = 0): Promise<Cat[]> {
    const params: Array<string | number> = [];
    const whereClause = buildWhereClause(search, healthStatus, params);
    const query = `SELECT id, nickname, description, photo_url, location_name, latitude, longitude, health_status, ownership_tag, created_by_user_id, created_at, updated_at FROM cats ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const [rows] = await db.execute<CatRow[]>(query, [...params, limit, offset]);
    return rows.map(mapCat);
  },

  async count(search?: string, healthStatus?: CatHealthStatus): Promise<number> {
    const params: Array<string | number> = [];
    const whereClause = buildWhereClause(search, healthStatus, params);
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM cats ${whereClause}`,
      params
    );
    return Number(rows[0]?.count ?? 0);
  }
};
