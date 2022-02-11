<script lang="ts">
  import Notice from '../../layout/Notice.svelte';
  import type { ReportCallbacks } from '../../layout/WindowReport.svelte';
  import {
    AgentName,
    AgentNamesByGroup,
    parseEncodedAgents,
    parseNicknames,
    compareToTrustedNames,
    compareUntrustedNames
  } from './agent_names';

  export let includeCsvAgents: boolean;
  export let includeSpecifyAgents: boolean;
  export let trustSpecifyAgents = true;
  export let callbacks: ReportCallbacks;

  let title: string;
  let subtitle = '';
  let notes = '';
  let primaryNameColumnLabel: string;
  let similarNameColumnLabel: string;
  let agentGroups: AgentName[][];

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

    callbacks.showStatus('Grouping agents by similarity...');
    if (csvAgents) {
      if (specifyAgents) {
        if (trustSpecifyAgents) {
          title = 'Comparison of CSV Agents with Specify Agents';
          subtitle = 'Trusting Specify, not trusting the CSV';
          primaryNameColumnLabel = 'Specify Agent Name';
          similarNameColumnLabel = 'Similar Agent Names from CSV';
          agentGroups = compareToTrustedNames(nicknames, specifyAgents, csvAgents);
        } else {
          title = 'Comparison of Specify Agents with CSV Agents';
          subtitle = 'Trusting the CSV, not trusting Speicfy';
          primaryNameColumnLabel = 'CSV Agent Name';
          similarNameColumnLabel = 'Similar Agent Names from Specify';
          agentGroups = compareToTrustedNames(nicknames, csvAgents, specifyAgents);
        }
      } else {
        title = 'Comparison of CSV Agent Names';
        subtitle = '(ignoring Specify agent names)';
        notes =
          'This report compares agent names in the CSV file with other names in the CSV file. It does not perform any comparisons with the Specify database.';
        primaryNameColumnLabel = 'Most Complete Agent Name';
        similarNameColumnLabel = 'Similar Agent Names';
        agentGroups = compareUntrustedNames(nicknames, csvAgents);
      }
    } else {
      if (!specifyAgents) {
        throw new Error('No agents specified for inclusion in report');
      }
      title = 'Comparison of Specify Agent Names';
      notes =
        'This report compares agent names in the Specify database with other names in the Specify database. It does not perform any comparisons with any CSV file.';
      primaryNameColumnLabel = 'Most Complete Agent Name';
      similarNameColumnLabel = 'Similar Agent Names';
      agentGroups = compareUntrustedNames(nicknames, specifyAgents);
    }

    callbacks.showReport(
      'agent_report',
      `<style>
        body {
          margin: 0;
          padding: 0;
        }
        .agent_report {
          margin: 1em;
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
          width: 800px;
        }
        .notes {
          margin: 1em 40px 0 40px;
        }
        .heading {
          font-weight: bold;
          margin: 1em 0;
        }
        .group {
          padding: .25em .5em;
        }
        .group:nth-child(even) {
          background-color: #eee;
        }
        .row {
          display: flex;
        }
        .col {
          flex: 1;
          margin-bottom: .3em;
        }
        .notes {
          font-style: italic;
        }
      </style>`
    );
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
        <div class="notes">{notes}</div>
      </div>
    {/if}
    {#if agentGroups.length == 0}
      <div class="none_found">No similar agent names found.</div>
    {:else}
      <div class="section">
        <div class="group row">
          <div class="col heading">{primaryNameColumnLabel}</div>
          <div class="col heading">{similarNameColumnLabel}</div>
          <div class="col" />
        </div>
        {#each agentGroups as groupOfNames}
          <div class="group">
            {#each groupOfNames as _, i}
              {@const similarCount = groupOfNames.length - 1}
              {@const firstColumnHeight = Math.ceil(similarCount / 2)}
              {@const similarIndex1 = i - 1}
              {@const similarIndex2 = similarIndex1 + firstColumnHeight}
              {#if similarIndex1 == 0}
                <div class="row">
                  <div class="col">
                    {groupOfNames[0].toString()} [{similarCount}]
                  </div>
                  <div class="col">
                    {groupOfNames[1].toString()}
                  </div>
                  {#if similarCount > 1}
                    <div class="col">
                      {groupOfNames[similarIndex2 + 1].toString()}
                    </div>
                  {:else}
                    <div class="col" />
                  {/if}
                </div>
              {:else if similarIndex1 > 0 && similarIndex1 < firstColumnHeight}
                <div class="row">
                  <div class="col" />
                  <div class="col">{groupOfNames[similarIndex1 + 1].toString()}</div>
                  {#if similarIndex2 < similarCount}
                    <div class="col">
                      {groupOfNames[similarIndex2 + 1].toString()}
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
