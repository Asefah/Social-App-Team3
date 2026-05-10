import * as ImagePicker from "expo-image-picker";
import { Alert, Platform } from "react-native";

export type PickedAsset = { uri: string; mimeType?: string };

export type PickImageOptions = {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
};

const baseDefaults: PickImageOptions = {
  allowsEditing: false,
  quality: 0.85,
};

async function pickFromLibrary(
  o: PickImageOptions
): Promise<PickedAsset | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    Alert.alert(
      "Permission needed",
      "Allow photo library access in Settings to add images."
    );
    return null;
  }
  const picker: ImagePicker.ImagePickerOptions = {
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: o.allowsEditing ?? false,
    quality: o.quality ?? 0.85,
  };
  if (o.allowsEditing && o.aspect) {
    picker.aspect = o.aspect;
  }
  const result = await ImagePicker.launchImageLibraryAsync(picker);
  if (result.canceled || !result.assets?.[0]) return null;
  const a = result.assets[0];
  return { uri: a.uri, mimeType: a.mimeType ?? undefined };
}

async function pickFromCamera(
  o: PickImageOptions
): Promise<PickedAsset | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== "granted") {
    Alert.alert(
      "Permission needed",
      "Allow camera access in Settings to take a photo."
    );
    return null;
  }
  const picker: ImagePicker.ImagePickerOptions = {
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: o.allowsEditing ?? false,
    quality: o.quality ?? 0.85,
  };
  if (o.allowsEditing && o.aspect) {
    picker.aspect = o.aspect;
  }
  const result = await ImagePicker.launchCameraAsync(picker);
  if (result.canceled || !result.assets?.[0]) return null;
  const a = result.assets[0];
  return { uri: a.uri, mimeType: a.mimeType ?? undefined };
}

/**
 * Shows library vs camera. On web, returns null (use URL fields).
 */
export function pickImageWithSourceChooser(
  options: PickImageOptions = {}
): Promise<PickedAsset | null> {
  const o = { ...baseDefaults, ...options };
  if (Platform.OS === "web") {
    Alert.alert(
      "Photos",
      "Library and camera aren’t available on web in this build. Paste an image URL instead."
    );
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    Alert.alert("Add photo", "Choose a source", [
      { text: "Cancel", style: "cancel", onPress: () => resolve(null) },
      {
        text: "Photo library",
        onPress: () => {
          void pickFromLibrary(o).then(resolve);
        },
      },
      {
        text: "Camera",
        onPress: () => {
          void pickFromCamera(o).then(resolve);
        },
      },
    ]);
  });
}
