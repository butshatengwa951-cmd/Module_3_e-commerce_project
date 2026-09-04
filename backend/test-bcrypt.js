import bcrypt from "bcryptjs";

const plainPassword = "Password123!";

try {
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    console.log("Original password:");
    console.log(plainPassword);

    console.log("\nHashed password:");
    console.log(hashedPassword);

    const passwordMatches = await bcrypt.compare(
        plainPassword,
        hashedPassword
    );

    console.log("\nPassword comparison:");
    console.log(passwordMatches);
} catch (error) {
    console.error("Bcrypt test failed!");
    console.error(error.message);
}