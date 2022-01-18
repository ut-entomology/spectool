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

/**
 * Query for returning all collections in the database.
 */
export async function getAllCollections(db: DB) {
  type Row = {
    CollectionID: number;
    CollectionName: string;
  };
  return (
    await db.execute(`select CollectionID, CollectionName from collection`)
  )[0] as Row[];
}

/**
 * Query returning a user's per-collection login credentials.
 */
export async function getUserCredentials(db: DB, username: string) {
  type Row = {
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
  )[0] as Row[];
}

/**
 * Query returning all geographic regions.
 */
export async function getAllGeographicRegions(db: DB) {
  type Row = {
    GeographyID: number;
    RankID: number;
    Name: string;
    ParentID: number;
  };
  return (
    await db.execute(`select GeographyID, RankID, Name, ParentID from geography`)
  )[0] as Row[];
}

/**
 * Query returning all geography IDs in use by a given collection.
 */
export async function getCollectionGeographyIDs(db: DB, collectionID: number) {
  type Row = {
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
  )[0] as Row[];
}

/**
 * Query returning all available ranks of geography.
 */
export async function getGeographyRanks(db: DB) {
  type Row = {
    RankID: number;
    Name: string;
  };
  return (
    await db.execute(`select RankID, Name from geographytreedefitem`)
  )[0] as Row[];
}

/**
 * Query returning all localities found in any of a given set of geographic regions.
 */
export async function getGeographicRegionLocalities(db: DB, forGeographyIDs: number[]) {
  type Row = {
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
  )[0] as Row[];
}
