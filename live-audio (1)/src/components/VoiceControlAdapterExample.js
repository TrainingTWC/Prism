/**
 * This file provides an example of how to connect the parsed voice commands
 * from the `useVoiceCommands` hook to your actual application logic.
 * You would import this function (or implement similar logic) inside the
 * component that manages your checklist state.
 */

/**
 * An adapter function that takes a parsed command and calls the appropriate
 * application action.
 *
 * @param {{action: 'open'|'fill'|'unknown', target: string|null, raw: string}} command
 * The parsed command object from the `useVoiceCommands` hook.
 *
 * @param {object} actions An object containing your application's state update functions.
 * @param {(name: string) => void} actions.openChecklistByName A function to open a checklist by its name.
 * @param {(name: string, fields: object) => void} actions.fillChecklistFields A function to populate fields for a given checklist.
 */
export function applyVoiceCommandToChecklist(command, { openChecklistByName, fillChecklistFields }) {
  if (!command || !command.target) {
    console.warn('Received command without a target:', command);
    return;
  }

  const { action, target } = command;

  switch (action) {
    case 'open':
      if (openChecklistByName) {
        openChecklistByName(target);
      } else {
        console.error('openChecklistByName action is not provided.');
      }
      break;

    case 'fill':
      if (fillChecklistFields) {
        // In a real scenario, you might use an LLM or more advanced parsing
        // to extract field values from the raw transcript.
        // For this demo, we'll use placeholder data.
        const mockFields = {
          am_name: 'John Doe (from voice)',
          location: target,
          shift: 'Morning',
          last_updated: new Date().toISOString(),
        };
        fillChecklistFields(target, mockFields);
      } else {
        console.error('fillChecklistFields action is not provided.');
      }
      break;

    case 'unknown':
    default:
      console.log(`Could not handle unknown command for target "${target}"`);
      break;
  }
}
