import knex, { Knex } from "knex";

interface UserRecord {
  firstname: string;
}

export function getFirstNames(
  username: string,
  password: string,
  lastName: string,
  callback: (err: any, firstNames: string[]) => void
): void {
  const domain = "entomology.tacc.utexas.edu";
  const dbName = "specify_dev";
  // `mysql://${username}:${password}@tcp(${domain})/${dbName}`

  let db: Knex;
  try {
    db = knex({
      client: "mysql2",
      connection: {
        host: domain,
        port: 3306,
        user: username,
        password: password,
        database: dbName
      }
    });

    db.select("firstname")
      .from<UserRecord>("agent")
      .where("lastname", lastName)
      .asCallback((err: any, rows: UserRecord[]) => {
        if (err) {
          callback(err, []);
          return;
        }
        const firstNames: string[] = [];
        for (const row of rows) {
          firstNames.push(row.firstname);
        }
        callback(null, firstNames);
      });
  } catch (err) {
    callback(err, []);
  }
}
