<script lang="ts">
  import BigSpinner from '../../components/BigSpinner.svelte';
  import Notice from '../../layout/Notice.svelte';
  import StatusMessage from '../../layout/StatusMessage.svelte';
  import { showStatus } from '../../layout/StatusMessage.svelte';
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

  let title: string;
  let subtitle = '';
  let notes = '';
  let primaryNameColumnLabel: string;
  let similarNameColumnLabel: string;
  let agentGroups: AgentName[][];

  async function prepare() {
    let csvAgents: AgentNamesByGroup | null = null;
    if (includeCsvAgents) {
      showStatus('Loading agents from CSV file...');
      const csvEncodings = await window.apis.specimenSetApi.getEncodedAgents();
      showStatus('Parsing the CSV agents...');
      csvAgents = parseEncodedAgents(csvEncodings);
    }

    let specifyAgents: AgentNamesByGroup | null = null;
    if (includeSpecifyAgents) {
      showStatus('Loading agents from Specify...');
      const specifyEncodings = await window.apis.agentApi.getEncodedAgents();
      showStatus('Parsing the Specify agents...');
      specifyAgents = parseEncodedAgents(specifyEncodings);
    }

    showStatus('Loading and parsing nicknames...');
    const fetchResponse = await fetch('/data/nicknames.txt');
    const rawNicknames = await fetchResponse.text();
    const nicknames = parseNicknames(rawNicknames);

    showStatus('Grouping agents by similarity...');
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
  }
  showStatus('Rendering report...');

  function closeWindow() {
    window.close();
  }
</script>

{#await prepare()}
  <StatusMessage />
  <BigSpinner centered={true} />
{:then}
  <div class="agent_report">
    <div class="title">{title}</div>
    {#if subtitle != ''}
      <div class="subtitle">{subtitle}</div>
    {/if}
    {#if notes != ''}
      <div class="container-md">
        <div class="row notes">{notes}</div>
      </div>
    {/if}
    {#if agentGroups.length == 0}
      <div class="none_found">No similar agent names found.</div>
    {:else}
      <div class="container-md">
        <div class="row mb-2">
          <div class="col-6">{primaryNameColumnLabel}</div>
          <div class="col-6">{similarNameColumnLabel}</div>
        </div>
        {#each agentGroups as group}
          <div class="row mb-1">
            {#each group as _, i}
              {#if i == 1}
                <div class="col-6">{group[0].toString()}</div>
                <div class="col-6">{group[1].toString()}</div>
              {:else if i >= 2}
                <div class="col-6" />
                <div class="col-6">{group[i].toString()}</div>
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

<style>
  .agent_report {
    margin: 3em 0 2em 0;
  }
  .title {
    font-size: 1.4em;
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
  .notes {
    font-style: italic;
  }
</style>
