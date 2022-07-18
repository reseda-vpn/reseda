import WireGuard from "@root/reseda";
import { createContext } from "react";

const WireguardContext = createContext<WireGuard>(null);

export default WireguardContext;