<script lang="ts">
  import BigSpinner from '../../components/BigSpinner.svelte';
  import Notice from '../../layout/Notice.svelte';
  import StatusMessage from '../../layout/StatusMessage.svelte';
  import { showStatus } from '../../layout/StatusMessage.svelte';

  const SUFFIXES = ['jr', 'sr', 'ii', 'iii', '2nd', '3rd'];

  interface Agent {
    isInSpecify: boolean;
    isInCSV: boolean;
    groupName: string;
    words: string[];
    phonetics: string[];
  }

  const agentsByGroupCode: Record<string, Agent[]> = {};

  async function prepare() {
    showStatus('Loading agents from Specify...');
    const specifyEncodings = await window.apis.agentApi.getEncodedAgents();

    showStatus('Loading agents from CSV file...');
    const csvEncodings = await window.apis.specimenSetApi.getEncodedAgents();

    showStatus('Parsing agents...');
    parseEncodedAgents(specifyEncodings, true);
    parseEncodedAgents(csvEncodings, false);

    showStatus('Grouping agents by similarity...');
  }

  function parseEncodedAgents(encodings: string, fromSpecify: boolean) {
    const entries = encodings.split('|');
    for (let i = 0; i < entries.length; i += 2) {
      const words = entries[i].split(' ');
      const phonetics = entries[i + 1].split(' ');

      let groupNameIndex = words.length - 1;
      if (groupNameIndex > 0) {
        if (SUFFIXES.includes(words[groupNameIndex].toLowerCase())) {
          --groupNameIndex;
        }
      }
      const groupName = words[groupNameIndex];
      const groupCode = phonetics[groupNameIndex];

      let group = agentsByGroupCode[groupCode];
      if (!group) {
        group = [];
        agentsByGroupCode[groupCode] = group;
      }
      group.push({ 
        isInSpecify: fromSpecify,
        isInCSV: !fromSpecify,
        groupName, words, phonetics
      });
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
