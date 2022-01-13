#include <wchar.h>
#include "libloaderapi.h"

int main(int argc, char *argv[]) {
    if (!wcscmp(argv[1], L"/service") && wargc == 3) {
        HMODULE tunnel_lib = LoadLibrary("tunnel.dll");
        if (!tunnel_lib)
            abort();
        tunnel_proc_t tunnel_proc = (tunnel_proc_t)GetProcAddress(tunnel_lib, "WireGuardTunnelService");
        if (!tunnel_proc)
            abort();
        return tunnel_proc(argv[2]);
    }  
}