import { getMongoDb } from "@/app/api/utils/mongo";

export async function GET(request) {
  try {
    const db = await getMongoDb();
    
    // Test connection
    await db.command({ ping: 1 });
    
    // Count documents in key collections
    const authUsersCount = await db.collection("auth_users").countDocuments();
    const authAccountsCount = await db.collection("auth_accounts").countDocuments();
    const usersCount = await db.collection("users").countDocuments();
    
    // Get super admin
    const superAdmin = await db.collection("auth_users").findOne(
      { email: "fasihzaidi480@gmail.com" },
      { projection: { _id: 0, email: 1, id: 1 } }
    );
    
    let superAdminAccount = null;
    if (superAdmin) {
      superAdminAccount = await db.collection("auth_accounts").findOne(
        { userId: superAdmin.id, provider: "credentials" },
        { projection: { _id: 0, userId: 1, provider: 1, password: 1 } }
      );
    }
    
    return Response.json({
      success: true,
      mongodb: {
        connected: true,
        collections: {
          auth_users: authUsersCount,
          auth_accounts: authAccountsCount,
          users: usersCount,
        },
      },
      superAdmin: {
        found: !!superAdmin,
        id: superAdmin?.id,
        email: superAdmin?.email,
        hasAccount: !!superAdminAccount,
        hasPassword: !!superAdminAccount?.password,
        passwordLength: superAdminAccount?.password?.length || 0,
      },
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
