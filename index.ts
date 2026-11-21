// The app's entry: Expo Router's, plus the sheet Android opens from the text-selection menu
// (modules/vyra-text, ProcessTextActivity) and the background-check task.
import "expo-router/entry";

import { AppRegistry } from "react-native";

import "@/lib/background";
import { ProcessTextSheet } from "@/sheet/process-text";

AppRegistry.registerComponent("vyra-sheet", () => ProcessTextSheet);
