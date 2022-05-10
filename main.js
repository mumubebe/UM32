import {readFileSync} from 'fs'
import {Machine} from './machine.js'
import readline from 'readline';


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

let codex = loadCodex(process.argv[2]);

let machine = new Machine(codex);

//machine.run()

if (process.argv[3] == 'debug'){
    rl.on('line', ()=>{
        machine.cycle()
        machine.debug()
    })
} else {
    machine.run()
}



function loadCodex(file) {
    const program = readFileSync(file)
    const dv = new DataView(program.buffer);
    return dv
}


process.on('SIGINT', function() {
    console.log("Caught interrupt signal");

    if (i_should_exit)
        process.exit();
});

