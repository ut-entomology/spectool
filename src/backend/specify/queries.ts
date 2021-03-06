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
 * Returns the type of a row in the result set of a given query function F.
 */
export type RowType<F extends (...args: any[]) => Promise<any>> =
  ReturnType<F> extends Promise<infer S> ? (S extends (infer R)[] ? R : never) : never;

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
 * Query returning information about all Specify agents.
 */
export async function getAllAgents(db: DB) {
  type ResultRow = {
    AgentID: number;
    FirstName: string;
    MiddleInitial: string;
    LastName: string;
    Suffix: string;
  };
  return (
    await db.execute(
      `select AgentID, FirstName, MiddleInitial, LastName, Suffix
        from agent`
    )
  )[0] as ResultRow[];
}

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
 * Query returning all taxa neither occurring in a determination nor
 * containing any taxa occuring in a determination, restricted to a range
 * of creation dates.
 */
const QUERY_UNUSED_TAXA = `
  with recursive prospective_unused_taxa as (
    select t1.* from taxa1 as t1
    left join taxon t2 on t2.ParentID = t1.TaxonID
    left join dets as d1 on d1.TaxonID = t1.TaxonID
    where t2.ParentID is null and d1.DeterminationID is null

    union all

    select t3.* from taxa1 as t3
    join prospective_unused_taxa ut on ut.ParentID = t3.TaxonID
    -- next constraint is unnecessary but improves performance
    left join dets as d2 on d2.TaxonID = t3.TaxonID
    where d2.DeterminationID is null
  ),
  taxa1 as (
    select TaxonID, FullName, RankID, ParentID,
      CreatedByAgentID, TimestampCreated from taxon
  ),
  dets as (
    select DeterminationID, TaxonID from determination
  )
  select distinct
    TaxonID,
    FullName,
    RankID,
    ParentID,
    CreatedByAgentID,
    TimestampCreated
  from prospective_unused_taxa
  where TaxonID not in (
      with recursive used_taxa as (
        select t1.* from taxa2 as t1
        join (
          select TaxonID from determination
        ) as d on d.TaxonID = t1.TaxonID
    
        union all
    
        select t2.* from taxa2 as t2
        join used_taxa ut on ut.ParentID = t2.TaxonID
      ),
      taxa2 as (
        select TaxonID, ParentID from taxon
      )
      select distinct TaxonID from used_taxa
    )
    and TimestampCreated between ? and ?`;

/**
 * Remove the taxa having the given IDs from the taxon table, including
 * common names and attachments for the taxa.
 */
export async function removeTaxonIDs(db: DB, taxonIDs: number[]) {
  await db.query(`delete from commonnametx where TaxonID in (?)`, [taxonIDs]);
  await db.query(`delete from taxonattachment where TaxonID in (?)`, [taxonIDs]);
  await db.query(`delete from taxon where TaxonID in (?)`, [taxonIDs]);
}

/**
 * Query returning the ancestor taxa up to but excluding order of all unused taxa
 * that getUnusedTaxa() returns. The query excludes ranks order and above in order
 * to improve performance. Call getOrdersAndHigher() to get higher taxa. Note that
 * the result set may incliude unused taxa, because some unused taxa are ancestors
 * of other unused taxa.
 */
export async function getAncestorsOfUnusedTaxa(
  db: DB,
  oldestDate: Date,
  newestDate: Date
) {
  type ResultRow = {
    TaxonID: number;
    FullName: string;
    RankID: number;
    ParentID: number;
  };
  return (
    await db.query(
      `with recursive ancestor_taxa as (
          select t4.TaxonID, t4.FullName, t4.RankID, t4.ParentID from (` +
        QUERY_UNUSED_TAXA +
        `) as s
          join taxa as t4 on s.ParentID = t4.TaxonID
        
          union all
          
          select 
            t.TaxonID,
            t.FullName,
            t.RankID,
            t.ParentID
          from taxon t
          join ancestor_taxa at on at.ParentID = t.TaxonID
          where t.RankID > (select RankID from order_rank)
        ),
        order_rank as (
          select RankID from taxontreedefitem where Name="Order"
        )
        select distinct * from ancestor_taxa
        where RankID > (select RankID from order_rank)
        order by RankID`,
      [oldestDate, newestDate]
    )
  )[0] as ResultRow[];
}

/**
 * Query returning all taxa at rank order or higher.
 */
export async function getOrdersAndHigher(db: DB) {
  type ResultRow = {
    TaxonID: number;
    FullName: string;
    RankID: number;
    ParentID: number;
  };
  return (
    await db.execute(
      `select TaxonID, FullName, RankID, ParentID from taxon
         where RankID <= (select RankID from taxontreedefitem where Name="Order")`
    )
  )[0] as ResultRow[];
}

/**
 * Query returning the available taxonomic ranks.
 */
export async function getTaxonomicRanks(db: DB) {
  type ResultRow = {
    RankID: number;
    Name: string;
  };
  return (
    await db.execute(`select Name, RankID from taxontreedefitem`)
  )[0] as ResultRow[];
}

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
    FullName: string;
    RankID: number;
    ParentID: number;
    CreatedByAgentID: number;
    TimestampCreated: Date;
  };
  return (
    await db.query(QUERY_UNUSED_TAXA + ` and TaxonID >= ? order by TaxonID limit ?`, [
      oldestDate,
      newestDate,
      lowerBoundTaxonID,
      maxRows
    ])
  )[0] as ResultRow[];
}
