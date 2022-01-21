/**
 * This file contains all of the SQL that the app uses with the Specify database.
 * I've centralized the queries to make them easier to maintain as Specify evolves.
 * After each upgrade to the Specify database, someone familiar with the changes to
 * the schema can update this file without knowledge of the rest of the app.
 */

// NOTE: I chose to use a mysql2 connection over a Knex connection because
// Knex.raw<>() was not providing the type support needed to ensure that [0] is
// appended to the query result before it can be typecast to an array of rows.

import type * as mysql from 'mysql2/promise';

/**
 * Database client type on which to issue queries. Abstracts the implmentation.
 */
export type DB = mysql.Pool;

//// COLLECTIONS /////////////////////////////////////////////////////////////

/**
 * Query for returning all collections in the database.
 */
export async function getAllCollections(db: DB) {
  type ResultRow = {
    CollectionID: number;
    CollectionName: string;
  };
  return (
    await db.execute(`select CollectionID, CollectionName from collection`)
  )[0] as ResultRow[];
}

//// USERS & AGENTS //////////////////////////////////////////////////////////

/**
 * Query returning information about all Specify users.
 */
export async function getAllUsers(db: DB) {
  type ResultRow = {
    SpecifyUserID: number;
    AgentID: number;
    LastName: string;
    FirstName: string;
    Name: string;
    UserType: string;
  };
  return (
    await db.execute(
      `select u.SpecifyUserID, a.AgentID, a.LastName, a.FirstName, u.Name, u.UserType
        from specifyuser u
        join agent a on a.SpecifyUserID = u.SpecifyUserID`
    )
  )[0] as ResultRow[];
}

/**
 * Query returning a user's per-collection login credentials.
 */
export async function getUserCredentials(db: DB, username: string) {
  type ResultRow = {
    SpecifyUserID: number;
    Password: string;
    UserType: string;
    CollectionID: number;
  };
  return (
    await db.execute(
      `select u.SpecifyUserID, u.Password, r.UserType, r.CollectionID
        from specifyuser as u
        join spappresourcedir as r on u.SpecifyUserID = r.SpecifyUserID
        where r.CollectionID is not null and u.Name = ?`,
      [username]
    )
  )[0] as ResultRow[];
}

//// GEOGRAPHY ///////////////////////////////////////////////////////////////

/**
 * Query returning all geographic regions.
 */
export async function getAllGeographicRegions(db: DB) {
  type ResultRow = {
    GeographyID: number;
    RankID: number;
    Name: string;
    ParentID: number;
  };
  return (
    await db.execute(`select GeographyID, RankID, Name, ParentID from geography`)
  )[0] as ResultRow[];
}

/**
 * Query returning all geography IDs in use by a given collection.
 */
export async function getCollectionGeographyIDs(db: DB, collectionID: number) {
  type ResultRow = {
    GeographyID: number;
  };
  return (
    await db.execute(
      `select distinct loc.GeographyID from locality as loc
        join(
          select ce.LocalityID from collectingevent as ce
          join(
            select CollectingEventID from collectionobject
            where CollectionID = ?
          ) as ceID
          on ce.CollectingEventID = ceID.CollectingEventID
        ) as locID
        on loc.LocalityID = locID.LocalityID`,
      [collectionID]
    )
  )[0] as ResultRow[];
}

/**
 * Query returning all available ranks of geography.
 */
export async function getGeographyRanks(db: DB) {
  type ResultRow = {
    RankID: number;
    Name: string;
  };
  return (
    await db.execute(`select RankID, Name from geographytreedefitem`)
  )[0] as ResultRow[];
}

/**
 * Query returning all localities found in any of a given set of geographic regions.
 */
export async function getGeographicRegionLocalities(db: DB, forGeographyIDs: number[]) {
  type ResultRow = {
    LocalityID: number;
    Latitude1: number;
    Longitude1: number;
    LocalityName: string;
  };
  return (
    await db.execute(
      `select LocalityID, Latitude1, Longitude1, LocalityName from locality
            where GeographyID in ?`,
      [forGeographyIDs]
    )
  )[0] as ResultRow[];
}

//// TAXA ////////////////////////////////////////////////////////////////////

/**
 * Query returning a batch of taxa neither occurring in a determination nor
 * containing any taxa occuring in a determination, restricted to a range of
 * creation dates. The batches is given by a lower bound on taxon ID and the
 * maximum number of rows to return. Rows are orderd by taxon ID.
 */
export async function getUnusedTaxa(
  db: DB,
  oldestDate: Date,
  newestDate: Date,
  lowerBoundTaxonID: number,
  maxRows: number
) {
  type ResultRow = {
    TaxonID: number;
    Name: string;
    RankID: number;
    ParentID: number;
    CreatedByAgentID: number;
    TimestampCreated: Date;
  };
  return (
    await db.execute(
      `with recursive unused_taxa as (
          select t1.* from taxa as t1
          left join taxon t2 on t2.ParentID = t1.TaxonID
          left join dets as d1 on d1.TaxonID = t1.TaxonID
          where t2.ParentID is null and d1.DeterminationID is null
          
          union all
          
          select t3.* from taxa as t3
          join unused_taxa ut on ut.ParentID = t3.TaxonID
          left join dets as d2 on d2.TaxonID = t3.TaxonID
          where d2.DeterminationID is null
        ),
        taxa as (
          select TaxonID, Name, RankID, ParentID,
            CreatedByAgentID, TimestampCreated from taxon
        ),
        dets as (
          select DeterminationID, TaxonID from determination
        )
        select distinct
          TaxonID,
          Name,
          RankID,
          ParentID,
          CreatedByAgentID,
          TimestampCreated
        from unused_taxa
        where TimestampCreated between ? and ?
          and TaxonID >= ?
        order by TaxonID limit ?`,
      [oldestDate, newestDate, lowerBoundTaxonID, maxRows]
    )
  )[0] as ResultRow[];
}
