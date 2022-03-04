import type { RegionAccess } from '../region_access';
import type { Region } from '../../../shared/shared_geography';

export interface RegionNode {
  region: Region;
  localityCount: number;
  children?: RegionNode[];
  parentNode?: RegionNode;
}

export class MockRegionAccess implements RegionAccess {
  private _regionTree: RegionNode;
  private _adjacencyMap: Record<number, Region[]>;

  constructor(regionTree: RegionNode, adjacencyMap: Record<number, Region[]>) {
    this._regionTree = regionTree;
    this._adjacencyMap = adjacencyMap;
    this._recursiveAssignParents(undefined, this._regionTree);
  }

  getAdjacentRegions(toGeographyID: number): Region[] {
    return this._adjacencyMap[toGeographyID] || [];
  }

  getContainingRegions(aboveGeographyID: number): Region[] {
    const ancestors: Region[] = [];
    let node = this._findRegionNode(aboveGeographyID)!.parentNode;
    while (node) {
      ancestors.push(node.region);
      node = node.parentNode;
    }
    return ancestors;
  }

  getContainedRegions(underGeographyID: number): Region[] {
    const descendants: Region[] = [];
    const underNode = this._findRegionNode(underGeographyID)!;
    this._collectDescendants(descendants, underNode);
    return descendants;
  }

  getLocalityCount(forSingleGeographicID: number): number {
    return this._findRegionNode(forSingleGeographicID)!.localityCount;
  }

  private _collectDescendants(descendants: Region[], underNode: RegionNode): void {
    if (underNode!.children) {
      for (const child of underNode.children) {
        descendants.push(child.region);
        this._collectDescendants(descendants, child);
      }
    }
  }

  private _findRegionNode(regionID: number): RegionNode | null {
    return this._recursiveFindRegionNode(this._regionTree, regionID);
  }

  private _recursiveAssignParents(parent: RegionNode | undefined, child: RegionNode) {
    child.parentNode = parent;
    if (child.children) {
      for (const grandchild of child.children) {
        this._recursiveAssignParents(child, grandchild);
      }
    }
  }

  private _recursiveFindRegionNode(
    checkNode: RegionNode,
    regionID: number
  ): RegionNode | null {
    if (checkNode.region.id == regionID) {
      return checkNode;
    }
    if (!checkNode.children) {
      return null;
    }
    for (const child of checkNode.children) {
      const foundNode = this._recursiveFindRegionNode(child, regionID);
      if (foundNode) return foundNode;
    }
    return null;
  }
}
