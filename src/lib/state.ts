import WireGuard from "@components/reseda";
import { createContext } from "react";

const WireguardContext = createContext<WireGuard>(null);

export default WireguardContext;