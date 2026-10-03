export const NAV = {
  ROOT: "root",
  ADD_MARKER: "addMarker",
  ADD_SCREEN: "addScreen",
  TASK: "task",
  JOURNAL: "journal",
  JOURNAL_DETAIL: "journalDetail",
  HISTORY: "history",
  OTHERS: "others",
  TITLES: "titles",
  THEME_PICKER: "themePicker",
  LANGUAGE_PICKER: "languagePicker",
  BACKGROUND_PICKER: "backgroundPicker",
  GUIDES_LIST: "guidesList",
  GUIDE_TASKS: "guideTasks",
  EDIT_MODE: "editMode",
  FIELD_MENU: "fieldMenu",
  SETTINGS: "settings",
  LANGUAGE: "language",
  ABOUT: "about",
};

export function navReducer(state, action) {
  switch (action.type) {
    case "PUSH":
      return [...state, { type: action.navType, payload: action.payload }];
    case "POP":
      return state.length > 1 ? state.slice(0, -1) : state;
    case "REPLACE_TOP":
      return state.length > 0
        ? [...state.slice(0, -1), { type: action.navType, payload: action.payload }]
        : state;
    case "POP_TO":
      for (let i = state.length - 1; i >= 0; i--) {
        if (state[i].type === action.navType) return state.slice(0, i + 1);
      }
      return state;
    case "RESET":
      return [{ type: NAV.ROOT }];
    default:
      return state;
  }
}

export function handleBack(state) {
  if (state.length > 1) {
    return { handled: true, nextStack: state.slice(0, -1) };
  }
  return { handled: true, exit: true };
}
