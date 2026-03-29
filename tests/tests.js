const { password } = require("pg/lib/defaults");

async function loginNoPassword() {
    logFunctionCall(loginNoPassword);
    try {
        const response = await loginRequest( { email: "j@brothers.com" } );

        const data = await response.json().catch(() => null);
        assert(response.status === 401, "Login without password returns 401 (Unauthorized)");
        assert(data.message !== undefined, "Response should have a message");
        assert(data.message === "Authentication failed", "Message should be 'Authentication failed'");
    } catch (err) {
        console.error("Error during test execution:", err);
    }
}

async function loginNoEmail() {
    logFunctionCall(loginNoEmail);
    try {
        const response = await loginRequest( { password: "jb27071997" } );

        const data = await response.json().catch(() => null);
        assert(response.status === 401, "Login without email returns 401 (Unauthorized)");
        assert(data.message !== undefined, "Response should have a message");
        assert(data.message === "Authentication failed", "Message should be 'Authentication failed'");
    } catch (err) {
        console.error("Error during test execution:", err);
    }
}

async function loginSuccess() {
    logFunctionCall(loginSuccess);
    try {
        const response = await loginRequest({ email: "jonas@brothers.com", password: "jb27071997" });

        const data = await response.json().catch(() => null);

        const userData = parseJwt(data.token);

        assert(response.status === 200, "Login returns 200");
        assert(data !== null, "Response should not be empty");
        assert(typeof data.token === "string", "Token is a string");
        assert(data.token.length > 10, "Token is not empty garbage");
        assert(userData.roleLevel !== undefined, "User has a role level");
    } catch (err) {
        console.error("Error during test execution:", err);
    }
}

async function loginWrongPassword() {}

async function loginWrongEmail() {}

// Admin and Client level users deleting each other
async function removeUser_3And1() {
    logFunctionCall(removeUser_3And1);
    // TODO: Tests are passing but it's not how you'd expect. For some reason, the userRoutes delete user is receiving... Jonas@brothers.com? But we don't have this email. Good luck for you, me from the future.
    try {
        /* 
        * Test cases:
        * Body contains L1 and token contains L3
        * Body contains L1 and token contains L1 from another
        * Body contains L3 and token contains L1
        * Body contains L3 and token contains L3 from another 
        * L3 tries to delete L1
        * L1 tries to delete another L1
        * L1 tries to delete L3
        * L1 tries to delete self
        */
       
       // Body data
       const admin1Email = "test_admin1@submerch.com";
       const admin1Password = "Test_Admin1Password";
       const admin2Email = "test_admin2@submerch.com";
       const admin2Password = "Test_Admin2Password";

       const client1Email = "test_client1@submerch.com";
       const client1Password = "Test_Client1Password";
       const client2Email = "test_client2@submerch.com";
       const client2Password = "Test_Client2Password";
       
       // Bodies
       const registerAdmin1Body = {
           name: "test_admin_1",
           email: admin1Email,
           password: admin1Password,
           user_type: "ADMIN"
        };
        
        const registerClient1Body = {
            name: "test_client_1",
            email: client1Email,
            password: client1Password,
            user_type: "CLIENT"
        };

        const registerAdmin2Body = {
           name: "test_admin_2",
           email: admin2Email,
           password: admin2Password,
           user_type: "ADMIN"
        };
        
        const registerClient2Body = {
            name: "test_client_2",
            email: client2Email,
            password: client2Password,
            user_type: "CLIENT"
        };
        
        let deleteClient1Body = {
            email: client1Email,
            forceDelete: false
        }
 
        let deleteAdmin1Body = {
            email: admin1Email,
            forceDelete: false
        }

        let deleteClient2Body = {
            email: client2Email,
            forceDelete: false
        }
 
        let deleteAdmin2Body = {
            email: admin2Email,
            forceDelete: false
        }

        // Create users and check

        let admin1 = await registerUserRequest(registerAdmin1Body);
        if (admin1.status === 409) {
            admin1 = await loginRequest({ email: admin1Email, password: admin1Password });
        };
        
        let admin2 = await registerUserRequest(registerAdmin2Body);
        if (admin2.status === 409) {
            admin2 = await loginRequest({ email: admin2Email, password: admin2Password });
        };
        
        let client1 = await registerUserRequest(registerClient1Body);
        if (client1.status === 409) {
            client1 = await loginRequest({ email: client1Email, password: client1Password });
        };

        let client2 = await registerUserRequest(registerClient2Body);
        if (client2.status === 409) {
            client2 = await loginRequest({ email: client2Email, password: client2Password });
        };
        
        let admin1Data = await admin1.json();
        let client1Data = await client1.json();
        let admin2Data = await admin2.json();
        let client2Data = await client2.json();

        const b1t3 = await deleteUserRequest(deleteClient1Body, admin1Data.token);

        // regen client
        client1 = await registerUserRequest(registerClient1Body);
        client1Data = await client1.json();

        const b3t1 = await deleteUserRequest(deleteAdmin1Body, client1Data.token);

        const b1t1NoSelf = await deleteUserRequest(deleteClient1Body, client2Data.token);

        const b1t1Self = await deleteUserRequest(deleteClient1Body, client1Data.token);

        const b3t3NoSelf = await deleteUserRequest(deleteAdmin1Body, admin2Data.token);

        const b3t3Self = await deleteUserRequest(deleteAdmin2Body, admin2Data.token);

        assert(b1t3.status === 204, "Client is deleted by admin");
        assert(b3t1.status === 403, "Client cannot delete admin");
        assert(b1t1NoSelf.status === 403, "Client cannot delete other client than self");
        assert(b1t1Self.status === 204, "Client can delete themselves");
        assert(b3t3NoSelf.status === 204, "Admin can delete another admin");
        assert(b3t3Self.status === 204, "Admin can delete themselves");

        // Deleting users if tests fail to not have a chance of redundance
        await deleteUserRequest(deleteAdmin1Body, admin1Data.token);
        await deleteUserRequest(deleteAdmin2Body, admin2Data.token);
        await deleteUserRequest(deleteClient1Body, client1Data.token);
        await deleteUserRequest(deleteClient2Body, client2Data.token);
    } catch (err) {
        console.error("Error during test execution: ", err);
    }
}

async function removeUser_3Against2() {
    
}

async function removeUser_2Against1() {
    
}

async function deleteUserRequest(body, token) {
    return fetch("http://localhost:8080/users/removeUser", {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(body)
    });
}

async function registerUserRequest(body) {
    return fetch("http://localhost:8080/users/register", 
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });
}

async function loginRequest(body) {
    return fetch("http://localhost:8080/users/login", 
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });
}

function parseJwt(token) {
    const payload = token.split('.')[1]; // middle part
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    return JSON.parse(decoded);
}

function logFunctionCall(func) {
    const yellowBg = "\x1b[43m";
    const reset = "\x1b[0m";
    
    console.log(`${yellowBg} Calling function: ${func.name} ${reset}`);
}

function assert(condition, name) {
    // Silly colors because I deserve it :3
    const green = "\x1b[32m";
    const red = "\x1b[31m";
    const reset = "\x1b[0m";

    if (condition) {
        console.log(`${green}[PASS]${reset}: ${name}`);
    } else {
        console.error(`${red}[FAIL]${reset}: ${name}`);
    }
}

(async () => {
    await loginSuccess();
    await loginNoEmail();
    await loginNoPassword();
    await removeUser_3And1();
})();
