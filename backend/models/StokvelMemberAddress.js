import pool from "../config/db.js";

const getMembership = async (userId, db = pool) => {
  const [rows] = await db.query(
    `SELECT sm.stokvel_member_id, sm.stokvel_id, s.stokvel_name
     FROM stokvel_members sm
     INNER JOIN stokvels s ON s.stokvel_id=sm.stokvel_id
     WHERE sm.user_id=?
     LIMIT 1`,
    [userId]
  );
  if (!rows.length) {
    throw Object.assign(new Error("You are not a member of a Stokvel."), { statusCode: 403 });
  }
  return rows[0];
};

const normalise = (input = {}) => ({
  label: String(input.label || "Home").trim().slice(0, 50),
  recipient_name: String(input.recipient_name || "").trim().slice(0, 100),
  phone_number: String(input.phone_number || "").trim().slice(0, 20) || null,
  address_line_1: String(input.address_line_1 || "").trim().slice(0, 255),
  address_line_2: String(input.address_line_2 || "").trim().slice(0, 255) || null,
  city: String(input.city || "").trim().slice(0, 100),
  province: String(input.province || "").trim().slice(0, 100),
  postal_code: String(input.postal_code || "").trim().slice(0, 20),
  is_default: Boolean(input.is_default),
});

const validate = (address) => {
  for (const key of ["recipient_name", "address_line_1", "city", "province", "postal_code"]) {
    if (!address[key]) {
      throw Object.assign(new Error("Recipient name, address, city, province and postal code are required."), { statusCode: 400 });
    }
  }
};

export const getMemberAddresses = async (userId) => {
  const membership = await getMembership(userId);
  const [addresses] = await pool.query(
    `SELECT address_id,stokvel_member_id,label,recipient_name,phone_number,address_line_1,address_line_2,
            city,province,postal_code,is_default,created_at,updated_at
     FROM stokvel_member_addresses
     WHERE stokvel_member_id=?
     ORDER BY is_default DESC, created_at DESC, address_id DESC`,
    [membership.stokvel_member_id]
  );
  const [[memberCount]] = await pool.query(
    `SELECT COUNT(*) AS member_count FROM stokvel_members WHERE stokvel_id=?`,
    [membership.stokvel_id]
  );
  return { membership, member_count: Number(memberCount?.member_count || 0), addresses };
};

export const createMemberAddress = async (userId, input) => {
  const membership = await getMembership(userId);
  const address = normalise(input);
  validate(address);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [existing] = await connection.query(
      `SELECT address_id FROM stokvel_member_addresses WHERE stokvel_member_id=? LIMIT 1`,
      [membership.stokvel_member_id]
    );
    const makeDefault = address.is_default || existing.length === 0;
    if (makeDefault) {
      await connection.query(`UPDATE stokvel_member_addresses SET is_default=0 WHERE stokvel_member_id=?`, [membership.stokvel_member_id]);
    }
    const [result] = await connection.query(
      `INSERT INTO stokvel_member_addresses
       (stokvel_member_id,label,recipient_name,phone_number,address_line_1,address_line_2,city,province,postal_code,is_default)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [membership.stokvel_member_id,address.label,address.recipient_name,address.phone_number,address.address_line_1,address.address_line_2,address.city,address.province,address.postal_code,makeDefault ? 1 : 0]
    );
    await connection.commit();
    return { address_id: result.insertId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const updateMemberAddress = async (userId, addressId, input) => {
  const membership = await getMembership(userId);
  const address = normalise(input);
  validate(address);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [existing] = await connection.query(
      `SELECT address_id,is_default FROM stokvel_member_addresses WHERE address_id=? AND stokvel_member_id=? LIMIT 1 FOR UPDATE`,
      [addressId, membership.stokvel_member_id]
    );
    if (!existing.length) throw Object.assign(new Error("Address not found."), { statusCode: 404 });
    if (address.is_default) {
      await connection.query(`UPDATE stokvel_member_addresses SET is_default=0 WHERE stokvel_member_id=?`, [membership.stokvel_member_id]);
    }
    await connection.query(
      `UPDATE stokvel_member_addresses
       SET label=?,recipient_name=?,phone_number=?,address_line_1=?,address_line_2=?,city=?,province=?,postal_code=?,is_default=?
       WHERE address_id=? AND stokvel_member_id=?`,
      [address.label,address.recipient_name,address.phone_number,address.address_line_1,address.address_line_2,address.city,address.province,address.postal_code,address.is_default ? 1 : 0,addressId,membership.stokvel_member_id]
    );
    await connection.commit();
    return { address_id: Number(addressId) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const deleteMemberAddress = async (userId, addressId) => {
  const membership = await getMembership(userId);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [existing] = await connection.query(
      `SELECT address_id,is_default FROM stokvel_member_addresses WHERE address_id=? AND stokvel_member_id=? LIMIT 1 FOR UPDATE`,
      [addressId, membership.stokvel_member_id]
    );
    if (!existing.length) throw Object.assign(new Error("Address not found."), { statusCode: 404 });
    await connection.query(`DELETE FROM stokvel_member_addresses WHERE address_id=? AND stokvel_member_id=?`, [addressId, membership.stokvel_member_id]);
    if (existing[0].is_default) {
      await connection.query(
        `UPDATE stokvel_member_addresses SET is_default=1
         WHERE address_id=(SELECT address_id FROM (
           SELECT address_id FROM stokvel_member_addresses WHERE stokvel_member_id=? ORDER BY created_at ASC,address_id ASC LIMIT 1
         ) next_address)`,
        [membership.stokvel_member_id]
      );
    }
    await connection.commit();
    return { address_id: Number(addressId) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const setDefaultMemberAddress = async (userId, addressId) => {
  const membership = await getMembership(userId);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [existing] = await connection.query(
      `SELECT address_id FROM stokvel_member_addresses WHERE address_id=? AND stokvel_member_id=? LIMIT 1 FOR UPDATE`,
      [addressId, membership.stokvel_member_id]
    );
    if (!existing.length) throw Object.assign(new Error("Address not found."), { statusCode: 404 });
    await connection.query(`UPDATE stokvel_member_addresses SET is_default=0 WHERE stokvel_member_id=?`, [membership.stokvel_member_id]);
    await connection.query(`UPDATE stokvel_member_addresses SET is_default=1 WHERE address_id=?`, [addressId]);
    await connection.commit();
    return { address_id: Number(addressId) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
