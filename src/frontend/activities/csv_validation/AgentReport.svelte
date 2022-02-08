<script lang="ts">
  import BigSpinner from '../../components/BigSpinner.svelte';
  import Notice from '../../layout/Notice.svelte';
  import StatusMessage from '../../layout/StatusMessage.svelte';
  import { showStatus } from '../../layout/StatusMessage.svelte';
  import { AgentName, parseNicknames } from './agent_names';

  type AgentNamesByGroup = Record<string, AgentName[]>;

  async function prepare() {
    showStatus('Loading agents from Specify...');
    const specifyEncodings = await window.apis.agentApi.getEncodedAgents();

    showStatus('Loading agents from CSV file...');
    const csvEncodings = await window.apis.specimenSetApi.getEncodedAgents();

    showStatus('Parsing agents...');
    const specifyAgents = parseEncodedAgents(specifyEncodings);
    const csvAgents = parseEncodedAgents(csvEncodings);

    showStatus('Loading and parsing nicknames...');
    const fetchResponse = await fetch('/data/nicknames.txt');
    const rawNicknames = await fetchResponse.text();
    const nicknames = await parseNicknames(rawNicknames);

    showStatus('Grouping agents by similarity...');
  }

  function parseEncodedAgents(encodings: string): AgentNamesByGroup {
    const namesByGroup: AgentNamesByGroup = {};
    const entries = encodings.split('|');
    for (let i = 0; i < entries.length; i += 2) {
      const agentName = new AgentName(entries[i], entries[i + 1]);
      const groupCode = agentName.getLastPhoneticCode() || '';

      let group = namesByGroup[groupCode];
      if (!group) {
        group = [];
        namesByGroup[groupCode] = group;
      }
      group.push(agentName);
    }
    return namesByGroup;
  }

  function closeWindow() {
    window.close();
  }
</script>

{#await prepare()}
  <StatusMessage />
  <BigSpinner centered={true} />
{:then}
  show report
{:catch err}
  <Notice
    header="Error"
    alert="danger"
    message="Failed to generate agents report: {err.message}"
    on:close={closeWindow}
  />
{/await}
