import { createApp } from "./app";
import { env } from "./config/env";

// 0.0.0.0: serverul e accesibil din rețeaua locală, ca aplicația Expo de pe telefon să-l poată apela.
createApp().listen(env.PORT, "0.0.0.0", () => {
  console.log(`Sintetico API pornit pe portul ${env.PORT}`);
});
