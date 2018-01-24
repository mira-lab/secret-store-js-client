'use strict'
const { EventEmitter } = require('events')

const ACCOUNT_ADDRESS_RAW = '0x00a329c0648769A73afAc7F9381E08FB43dBEA72'
const ACCOUNT_PASSWORD = ''
const KEY_DIRECTORY = '/parity-keys'
const FILES_DIRECTORY = '/encrypted'
const NODE_T = 0
let ACCOUNT_ADDRESS = ACCOUNT_ADDRESS_RAW.toLowerCase()

const os = require('os')
const fs = require('fs')
const findRemoveSync = require('find-remove')
const querystring = require('querystring')
const http = require('http')
const unirest = require('unirest')
const ethKey = require('keythereum')
const ethUtil = require('ethereumjs-util')
const secp256k1 = require('secp256k1')

class ParitySS extends EventEmitter {
  constructor (version) {
    super()

    this._version = version
//     this._peer = peer
//     this._send = send
//
//     this._status = null
//     this._peerStatus = null
//     this._statusTimeoutId = setTimeout(() => {
//       this._peer.disconnect(Peer.DISCONNECT_REASONS.TIMEOUT)
//     }, ms('5s'))
  }

//   version: '1.0.1',
//
//   constants: {
//
//     // Now all activity on localhost
//     host: 'localhost',
//
//     // SecretStorage communication port
//     portSS: 8082,
//
//     // Json RPC communication port
//     portJsonRPC: 8545,
//
//     // Symmetric cipher for private key encryption
//     cipher: "aes-128-ctr",
//
//     // Initialization vector size in bytes
//     ivBytes: 16,
//
//     // ECDSA private key size in bytes
//     keyBytes: 32,
//
//     // Key derivation function parameters
//     pbkdf2: {
//       c: 262144,
//       dklen: 32,
//       hash: "sha256",
//       prf: "hmac-sha256"
//     },
//     scrypt: {
//       memory: 280000000,
//       dklen: 32,
//       n: 262144,
//       r: 1,
//       p: 8
//     }
//   },

  /**
   * Recover private key from address + pwd, & key file exported from wallet.
   * @param {string} address Hex address of account.
   * @param {string} pwd Password for account.
   * @param {string} keydir Key directory relative to home dir.
   * @return {string} Recovered private key.
   */
  getPrivateKey (address, pwd, keydir) {
    let keyObj = ethKey.importFromFile(address, os.homedir() + keydir)
    return ethKey.recover(pwd, keyObj)
  }

  doRequest (port, endpoint, method, data, success) {
    let dataString = JSON.stringify(data)
    let headers = {}

    if (method === 'GET') {
      endpoint += '?' + querystring.stringify(data)
    } else {
      headers = {
        'Content-Type': 'application/json',
        'Content-Length': dataString.length
      }
    }
    let options = {
      host: this.constants.host,
      port: port,
      path: endpoint,
      method: method,
      headers: headers
    }

    let req = http.request(options, function (res) {
      res.setEncoding('utf-8')
      let responseString = ''

      res.on('data', function (data) {
        responseString += data
      })

      res.on('end', function () {
        // console.log(responseString)
        let responseObject = JSON.parse(responseString)
        success(responseObject)
      })
    })

    req.write(dataString)
    req.end()
  }

  doEncode (filename, documentBody, T) {
    this.doRequest(8545, '/', 'POST', {
      'method': 'personal_unlockAccount',
      'params': [ACCOUNT_ADDRESS, ACCOUNT_PASSWORD, null],
      'id': 1,
      'jsonrpc': '2.0'
    }, function (data) {
      console.log('\nUnlock account status: ', data.result)

      if (data.result) {
        this.doRequest(8545, '/', 'POST', {
          'method': 'parity_exportAccount',
          'params': [ACCOUNT_ADDRESS, ACCOUNT_PASSWORD],
          'id': 2,
          'jsonrpc': '2.0'
        }, function (data) {
          console.log('\nAccount data: ', data.result)

          let keydir = os.homedir() + KEY_DIRECTORY + '/keystore'
          findRemoveSync(keydir, {files: '*.*'})
          ethKey.exportToFile(data.result, keydir)

          this.encode(filename, documentBody, T)
        })
      }
    })
  }

  proceedEncrypted (filename, data, hash) {
    console.log('\nStatus code: ', data.status, '\nbody: ', data.body)

    let pathname = os.homedir() + KEY_DIRECTORY + FILES_DIRECTORY + '/' + filename
    fs.writeFileSync(pathname + '.key', hash)
    fs.writeFileSync(pathname + '.enc', data.body.result)
  }

  encode (filename, documentBody, T) {
    let privateKey = this.getPrivateKey(ACCOUNT_ADDRESS, ACCOUNT_PASSWORD, KEY_DIRECTORY)
    let address = ethKey.privateKeyToAddress(privateKey)
    console.log(`\nsecret is ${privateKey.toString('hex')},\naddress is ${address}`)

    let hash = ethUtil.sha3(documentBody + new Date().toISOString()).toString('hex')
    let signedHash = secp256k1.sign(Buffer.from(hash, 'hex'), privateKey)
    console.log(`\nsign is ${signedHash.signature.toString('hex')}`)

    this.doRequest(8082, '/' + hash + '/' + signedHash.signature.toString('hex') + '00/' + T, 'POST', {
    }, function (documentKey) {
      console.log('\nSimultaneously generate server-side and document key:', documentKey, '\n')

      let dataBinary = '{"jsonrpc": "2.0", "method": "secretstore_encrypt", "params": ["' + ACCOUNT_ADDRESS + '", "' +
        ACCOUNT_PASSWORD + '", "' + documentKey + '", "0x' + documentBody + '"], "id":777 }'
      let Request = unirest.post('http://127.0.0.1:8545/')
      Request.headers({'Content-Type': 'application/json'})
      Request.send(dataBinary)
      Request.end(data => this.proceedEncrypted(filename, data, hash))
    })
  }

  proceedDecrypted (shadowKeys, encrypted) {
    let dataBinary = '{"jsonrpc": "2.0", "method": "secretstore_shadowDecrypt", "params": ["' +
      ACCOUNT_ADDRESS + '", "' + ACCOUNT_PASSWORD + '", "' +
      shadowKeys.decrypted_secret + '", "' + shadowKeys.common_point +
      '", ["' + shadowKeys.decrypt_shadows + '"], "' +
      encrypted +
      '"], "id":111 }'
    let Request = unirest.post('http://127.0.0.1:8545/')
    Request.headers({'Content-Type': 'application/json'})
    Request.send(dataBinary)
    Request.end(function (data) {
      console.log(Buffer.from(data.body.result.replace('0x', ''), 'hex').toString('utf8'))
    })
  }

  decode (filename) {
    let privateKey = this.getPrivateKey(ACCOUNT_ADDRESS, ACCOUNT_PASSWORD, KEY_DIRECTORY)
    let pathname = os.homedir() + KEY_DIRECTORY + FILES_DIRECTORY + '/' + filename
    let encrypted = fs.readFileSync(pathname + '.enc').toString('ascii')
    let hash = fs.readFileSync(pathname + '.key').toString('ascii')
    let signedHash = secp256k1.sign(Buffer.from(hash, 'hex'), privateKey)

    console.log('\nhash is ', hash, ' signed is ', signedHash.signature.toString('hex'))

    let Request = unirest.get(this.constants.host + ':' + this.constants.portSS +
      '/shadow/' + hash + '/' + signedHash.signature.toString('hex') + '00')
    Request.end(documentKey => this.proceedDecrypted(documentKey.body, encrypted))
  }
}

let filename = process.argv[2]
if (filename === 'undefined') throw new Error('no filename specified!')

let documentBody = fs.readFileSync(os.homedir() + KEY_DIRECTORY + '/' + filename).toString('hex')
if (documentBody == null || documentBody === '') throw new Error('no file specified!')

const paritySS = new ParitySS('1.0.0')

let mode = process.argv[3]
if (mode === 'decode') {
  paritySS.decode(filename)
} else {
  paritySS.doEncode(filename, documentBody, NODE_T)
}
