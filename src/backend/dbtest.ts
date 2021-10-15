import knex, { Knex } from 'knex'

interface UserRecord {
  firstname: string
}

export function getFirstNames(
    username: string, password: string, lastName: string,
    callback: (err: any, firstNames: string[]) => void): void {

  let db: Knex
  try {
    db = knex({
      client: 'mysql2',
      connection: {
        host: "entomology.tacc.utexas.edu",
        port: 3306,
        user: username,
        password: password,
        database: "specify_dev"
      }
    })

    db.select("firstname")
      .from<UserRecord>("agent")
      .where("lastname", lastName)
      .asCallback((err: any, rows: UserRecord[]) => {
        if (err) {
          db.destroy()
          callback(err, [])
          return
        }
        const firstNames: string[] = []
        for (const row of rows) {
          firstNames.push(row.firstname)
        }
        db.destroy()
        callback(null, firstNames)
      })
    
  } catch (err) {
    db!.destroy()
    callback(err, [])
  }
}
