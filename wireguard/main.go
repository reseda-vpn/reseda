/* SPDX-License-Identifier: MIT
 *
 * Copyright (C) 2019-2022 WireGuard LLC. All Rights Reserved.
 */

package main

import (
	"C"
	"crypto/rand"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"unsafe"

	"golang.org/x/crypto/curve25519"

	"golang.zx2c4.com/wireguard/windows/conf"
	"golang.zx2c4.com/wireguard/windows/tunnel"
)

//export WireGuardTunnelService
func WireGuardTunnelService(confFile string) bool {
	// confFile := windows.UTF16PtrToString(confFile16)
	conf.PresetRootDirectory(filepath.Dir(confFile))
	tunnel.UseFixedGUIDInsteadOfDeterministic = true

	err := tunnel.Run(confFile)

	if err != nil {
		log.Printf("Service run error: %v", err)
		log.Printf(confFile)
	}

	return err == nil
}

//export WireGuardGenerateKeypair
func WireGuardGenerateKeypair(publicKey, privateKey *byte) {
	publicKeyArray := (*[32]byte)(unsafe.Pointer(publicKey))
	privateKeyArray := (*[32]byte)(unsafe.Pointer(privateKey))
	n, err := rand.Read(privateKeyArray[:])
	if err != nil || n != len(privateKeyArray) {
		panic("Unable to generate random bytes")
	}
	privateKeyArray[0] &= 248
	privateKeyArray[31] = (privateKeyArray[31] & 127) | 64

	curve25519.ScalarBaseMult(publicKeyArray, privateKeyArray)
}

func main() {
	function := os.Args[1]
	param := os.Args[2]

	fmt.Println("executing ", function)
	fmt.Println("with ", param)

	switch function {
	case "install":
		WireGuardTunnelService(param)
	case "generate":
		// WireGuardGenerateKeypair()
	default: /* Optional */
		fmt.Println("Nothing Declared")
	}
}
