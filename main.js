import {readFileSync} from 'fs'
import {Machine} from './machine.js'
import readline from 'readline';


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

let codex = loadCodex();

let machine = new Machine(codex);

//machine.run()
var args = process.argv.slice(2)[0];
if (args == 'debug'){
    rl.on('line', ()=>{
        machine.cycle()
        machine.debug()
    })
} else {
    machine.run()
}



function loadCodex() {
    const program = readFileSync('codex.umz')
    const dv = new DataView(program.buffer);
    return dv
}


