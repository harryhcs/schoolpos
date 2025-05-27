import { route } from "rwsdk/router";
import { Login } from "./Login";
import { sessions } from "@/session/store";
import { Products } from "./Products";
import { Reports } from "./Reports";
import { POS } from "./POS";
import { Settings } from "./Settings";
import { Users } from "./Users";

export const userRoutes = [
  route("/login", [Login]),
  route("/logout", async function ({ request }) {
    const headers = new Headers();
    await sessions.remove(request, headers);
    headers.set("Location", "/");

    return new Response(null, {
      status: 302,
      headers,
    });
  }),
  route("/products", [Products]),
  route("/reports", [Reports]),
  route("/pos", [POS]),
  route("/settings", [Settings]),
  route("/users", [Users]),
];
