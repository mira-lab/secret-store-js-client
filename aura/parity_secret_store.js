'use strict'

const PSS = require('../lib/paritySecretStore')

const ACCOUNT_ADDRESS = '0x00a329c0648769A73afAc7F9381E08FB43dBEA72'
const ACCOUNT_PASSWORD = ''
const KEY_DIRECTORY = '/parity-keys'
const FILES_DIRECTORY = '/encrypted'
const NODE_T = 0

const os = require('os')
const fs = require('fs')
const ethUtil = require('ethereumjs-util')

const paritySecretStore = new PSS(ACCOUNT_ADDRESS, ACCOUNT_PASSWORD, null)

let filename = process.argv[3]
if (filename === 'undefined') throw new Error('no filename specified!')

let documentBody = fs.readFileSync(os.homedir() + KEY_DIRECTORY + '/' + filename).toString('hex')
if (documentBody == null || documentBody === '') throw new Error('no file specified!')

let mode = process.argv[2]
if (mode === 'encode' || mode === 'e') {
  let storageId = ethUtil.sha3(documentBody + new Date().toISOString()).toString('hex')

  let proceedEncrypted = function (encrypted, storageId) {
    console.log('\nStatus code: ', encrypted.status, '\nbody: ', encrypted.body)

    let pathname = os.homedir() + KEY_DIRECTORY + FILES_DIRECTORY + '/' + filename
    fs.writeFileSync(pathname + '.key', storageId)
    fs.writeFileSync(pathname + '.enc', encrypted.body.result)
  }

  paritySecretStore.encode(storageId, documentBody, NODE_T, proceedEncrypted)
} else if (mode === 'decode' || mode === 'd') {
  let pathname = os.homedir() + KEY_DIRECTORY + FILES_DIRECTORY + '/' + filename
  let encrypted = fs.readFileSync(pathname + '.enc').toString('ascii')
  let storageId = fs.readFileSync(pathname + '.key').toString('ascii')

  let shadowDecrypt = function (decrypted) {
    console.log(decrypted)
  }

  paritySecretStore.shadowDecode(storageId, encrypted, shadowDecrypt)
} else if (mode === 'acc-export' || mode === 'a') {
  paritySecretStore.exportAccount()
} else {
  console.log('Usage are: parity_secret_storage [mode={<e>ncode, <d>ecode, <a>cc-export}] [filename]')
}
