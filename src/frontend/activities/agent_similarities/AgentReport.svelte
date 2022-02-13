<script lang="ts">
  import Notice from '../../layout/Notice.svelte';
  import type { ReportCallbacks } from '../../layout/WindowReport.svelte';
  import {
    WILDCARD_NAME,
    AgentName,
    AgentNamesByGroup,
    AgentComparison,
    parseEncodedAgents,
    parseNicknames,
    compareToTrustedNames,
    compareUntrustedNames,
    missingLastNameStandIn
  } from './agent_names';

  export let includeCsvAgents: boolean;
  export let includeSpecifyAgents: boolean;
  export let trustSpecifyAgents = true;
  export let callbacks: ReportCallbacks;

  const ORIGINAL_SPACE_CHAR = '&#183;';

  let title: string;
  let subtitle = '';
  let notes = '';
  let primaryNameColumnLabel: string;
  let similarNameColumnLabel: string;
  let results: AgentComparison;

  async function prepare() {
    let csvAgents: AgentNamesByGroup | null = null;
    if (includeCsvAgents) {
      callbacks.showStatus('Loading agents from CSV file...');
      const csvEncodings = await window.apis.specimenSetApi.getEncodedAgents();
      callbacks.showStatus('Parsing the CSV agents...');
      csvAgents = parseEncodedAgents(csvEncodings);
    }

    let specifyAgents: AgentNamesByGroup | null = null;
    if (includeSpecifyAgents) {
      callbacks.showStatus('Loading agents from Specify...');
      const specifyEncodings = await window.apis.agentApi.getEncodedAgents();
      callbacks.showStatus('Parsing the Specify agents...');
      specifyAgents = parseEncodedAgents(specifyEncodings);
    }

    callbacks.showStatus('Loading and parsing nicknames...');
    const fetchResponse = await fetch('/data/nicknames.txt');
    const rawNicknames = await fetchResponse.text();
    const nicknames = parseNicknames(rawNicknames);

    const middleDotNote = ` The middle dot (<span>${ORIGINAL_SPACE_CHAR}</span>) signifies a space that occurs within a name field. Regular spaces separate name fields.`;

    callbacks.showStatus('Grouping agents by similarity...');
    if (csvAgents) {
      if (specifyAgents) {
        if (trustSpecifyAgents) {
          title = 'Comparison of CSV Agents with Specify Agents';
          subtitle = 'Trusting Specify, not trusting the CSV';
          notes = middleDotNote;
          primaryNameColumnLabel = 'Specify Agent Name';
          similarNameColumnLabel = 'Similar Agent Names from CSV';
          results = compareToTrustedNames(nicknames, specifyAgents, csvAgents);
        } else {
          title = 'Comparison of Specify Agents with CSV Agents';
          subtitle = 'Trusting the CSV, not trusting Speicfy';
          notes = middleDotNote;
          primaryNameColumnLabel = 'CSV Agent Name';
          similarNameColumnLabel = 'Similar Agent Names from Specify';
          results = compareToTrustedNames(nicknames, csvAgents, specifyAgents);
        }
      } else {
        title = 'Comparison of CSV Agent Names';
        subtitle = '(ignoring Specify agent names)';
        notes =
          'This report compares agent names in the CSV file with other names in the CSV file, ignoring names in the Specify database.' +
          middleDotNote;
        primaryNameColumnLabel = 'Most Complete Agent Name';
        similarNameColumnLabel = 'Similar Agent Names';
        results = compareUntrustedNames(nicknames, csvAgents);
      }
    } else {
      if (!specifyAgents) {
        throw new Error('No agents specified for inclusion in report');
      }
      title = 'Comparison of Specify Agent Names';
      notes =
        'This report compares agent names in the Specify database with other names in the Specify database.' +
        middleDotNote;
      primaryNameColumnLabel = 'Most Complete Agent Name';
      similarNameColumnLabel = 'Similar Agent Names';
      results = compareUntrustedNames(nicknames, specifyAgents);
    }

    if (results.unknownLastNameGroup.length > 0) {
      results.unknownLastNameGroup.unshift(missingLastNameStandIn);
      results.groups.unshift(results.unknownLastNameGroup);
    }

    callbacks.showReport(
      'agent_report',
      `<style>
        body {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        .agent_report {
          padding: 1em;
          padding-top: 0;
        }
        .title {
          font-size: 1.3em;
          text-align: center;
        }
        .subtitle {
          font-size: 1.2em;
          text-align: center;
          margin-top: 0.6em;
        }
        .none_found {
          font-size: 1.2em;
          text-align: center;
          font-weight: bold;
          margin-top: 4em;
        }
        .section {
          width: 780px;
          margin: 0 auto;
        }
        .notes {
          margin: 1em 40px 0 40px;
        }
        .heading {
          font-weight: bold;
          margin: 1em 0;
        }
        .group {
          padding: 0 .5em;
        }
        .group + .group {
          padding: .25em .5em;
        }
        .group:nth-child(even) {
          background-color: #eee;
        }
        .row {
          display: flex;
        }
        .row + .row {
          margin-top: .3em;
        }
        .col {
          flex: 1;
        }
        .notes {
          font-style: italic;
        }
        span {
          color: #666;
        }
      </style>`
    );
  }

  function toDisplayName(name: AgentName): string {
    if (name == missingLastNameStandIn) {
      return '* (any with no last name)';
    }
    return name.name
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\^/g, `<span>${ORIGINAL_SPACE_CHAR}</span>`);
  }

  function closeWindow() {
    window.close();
  }
</script>

{#await prepare() then}
  <div class="agent_report">
    <div class="title">{title}</div>
    {#if subtitle != ''}
      <div class="subtitle">{subtitle}</div>
    {/if}
    {#if notes != ''}
      <div class="section">
        <div class="notes">{@html notes}</div>
      </div>
    {/if}
    {#if results.groups.length == 0}
      <div class="none_found">No similar agent names found.</div>
    {:else}
      <div class="section">
        <div class="group row">
          <div class="col heading">{primaryNameColumnLabel}</div>
          <div class="col heading">{similarNameColumnLabel}</div>
          <div class="col" />
        </div>
        {#each results.groups as groupOfNames}
          <div class="group">
            {#each groupOfNames as _, i}
              {@const similarCount = groupOfNames.length - 1}
              {@const firstColumnHeight = Math.ceil(similarCount / 2)}
              {@const similarIndex1 = i - 1}
              {@const similarIndex2 = similarIndex1 + firstColumnHeight}
              {#if similarIndex1 == 0}
                <div class="row">
                  <div class="col">
                    {#if groupOfNames[0].name == WILDCARD_NAME}
                      * (no last name)
                    {:else}
                      {@html toDisplayName(groupOfNames[0])}
                    {/if}
                  </div>
                  <div class="col">
                    {@html toDisplayName(groupOfNames[1])}
                  </div>
                  {#if similarCount > 1}
                    <div class="col">
                      {@html toDisplayName(groupOfNames[similarIndex2 + 1])}
                    </div>
                  {:else}
                    <div class="col" />
                  {/if}
                </div>
              {:else if similarIndex1 > 0 && similarIndex1 < firstColumnHeight}
                <div class="row">
                  <div class="col" />
                  <div class="col">
                    {@html toDisplayName(groupOfNames[similarIndex1 + 1])}
                  </div>
                  {#if similarIndex2 < similarCount}
                    <div class="col">
                      {@html toDisplayName(groupOfNames[similarIndex2 + 1])}
                    </div>
                  {:else}
                    <div class="col" />
                  {/if}
                </div>
              {/if}
            {/each}
          </div>
        {/each}
      </div>
    {/if}
  </div>
{:catch err}
  <Notice
    header="Error"
    alert="danger"
    message="Failed to generate agents report: {err.message}"
    on:close={closeWindow}
  />
{/await}
