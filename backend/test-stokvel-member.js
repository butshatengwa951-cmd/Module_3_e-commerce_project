import pool from "./config/db.js";

import {
    createStokvelMembership,
    findMembershipByUserId,
    findMembership,
    getMembersByStokvelId
} from "./models/StokvelMem.js";

try {
    const userId = 2;
    const stokvelId = 1;

    const existingMembership = await findMembership(
        stokvelId,
        userId
    );

    console.log("Existing membership:");
    console.log(existingMembership);

    if (!existingMembership) {
        const newMembership = await createStokvelMembership(
            stokvelId,
            userId
        );

        console.log("\nNew membership:");
        console.log(newMembership);
    } else {
        console.log("\nMembership already exists. Skipping insert.");
    }

    const membershipByUser = await findMembershipByUserId(userId);

    console.log("\nMembership for user:");
    console.log(membershipByUser);

    const members = await getMembersByStokvelId(stokvelId);

    console.log("\nMembers of stokvel:");
    console.log(members);
} catch (error) {
    console.error("Stokvel member test failed!");
    console.error(error.message);
} finally {
    await pool.end();
}