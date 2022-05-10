import readline from 'readline';
import readlineSync from 'readline-sync'

class InputLoad {
    constructor(input) {
        this.input = input + "\n"
        this.count = 0;
    }
    isFinished() {
        return (this.count == this.input.length)
    }
    nxt() {
        if (!this.isFinished()) {
            let l = this.input[this.count];
            this.count++;
            return l;

        }
    }
}

export class Machine {
    constructor(codex) {
        this.inputLoad;
        this.count = 0
        this.finger = 0;
        this.arrays = []
        this.allocFreeIndex = [];

        this.arrays.push(codex)

        this.registers = {
            0: this.createPlatter(1),
            1: this.createPlatter(1),
            2: this.createPlatter(1),
            3: this.createPlatter(1),
            4: this.createPlatter(1),
            5: this.createPlatter(1),
            6: this.createPlatter(1),
            7: this.createPlatter(1),
        }
    }

    run() {
        while(true) {
            this.cycle();
        }
    }

    cycle() {
        this.currentPlatter = this.getPlatterAt(0, this.finger);
        const instruction = this.getInstruction(this.currentPlatter);
        this.execute(instruction)
        if (instruction != 12) {
            this.finger +=4 ;
        }
    }
    
    execute(instruction) {
        let A = this.getA(this.currentPlatter)
        let B = this.getB(this.currentPlatter)
        let C = this.getC(this.currentPlatter)

        switch(instruction) {
            case 0:
                if (!(this.getRegister(C) == 0)) { 
                    this.setRegister(A, this.getRegister(B))
                }
                break;

            case 1:              
                this.setRegister(A, 
                    this.arrays[this.getRegister(B)].getUint32(this.getRegister(C) * 4)
                    )
                break;

            case 2:
                this.arrays[this.getRegister(A)].setUint32(this.getRegister(B) * 4, this.getRegister(C))
                break;

            case 3:
                this.setRegister(A, 
                    (this.getRegister(B) + this.getRegister(C)) % (2**32)
                        )
                break;

            case 4:
                this.setRegister(A, 
                    (this.getRegister(B) * this.getRegister(C)) % (2**32)
                )
                break;
            
            case 5:
                this.setRegister(A, (
                    Math.floor(this.getRegister(B) / this.getRegister(C))
                ));
                break;

            case 6:
                this.setRegister(A, (
                    ~(this.getRegister(B) & this.getRegister(C)) >>> 0 // >>> 0 set as usigned
                ))
                break;

            case 7:
                throw new Error('HALT');
        
            case 8:
                if (this.allocFreeIndex.length > 0) {
                    let index = this.allocFreeIndex.pop();
                    this.arrays[index] = this.createPlatter(
                        this.getRegister(C)
                    )
                    this.setRegister(B, index);
                } else {
                    this.arrays.push(this.createPlatter(
                        this.getRegister(C)
                    ))
                    this.setRegister(B, this.arrays.length - 1);
                }
                break;

            case 9:
                if (this.getRegister(C) == 0) break;
                this.arrays[this.getRegister(C)] = []
                // Keep track of free spots
                this.allocFreeIndex.push(this.getRegister(C))
                break;
            
            case 10:
                let c = this.getRegister(C)
                if (c >= 0 && c <=255) {
                    process.stdout.write(new Uint8Array([c]));
                }
                
                break;
            case 11:
                if (this.inputLoad?.isFinished() || !this.inputLoad) {
                    let inp = readlineSync.question('');
                    this.inputLoad = new InputLoad(inp)
                }
                this.setRegister(C, this.inputLoad.nxt().charCodeAt(0))
                break;

            case 12:
                const i = this.getRegister(B)
                if (i) {
                    this.arrays[0] = new DataView(this.arrays[i].buffer.slice(0));
                }
                this.finger = this.getRegister(C) * 4
                break;

            case 13:
                let OA = this.getOrthographyA(this.currentPlatter)
                const value = this.getOrthographyValue(this.currentPlatter)
                this.setRegister(OA, value);
                break;
        }
    }


    getInstruction(platter) {
        // shift 28 to right
        return platter >>> 28
    }

    getA(ui32) {
        // Shift bits to right 6 positions and grab 3 last
        return (ui32 >> 6) & 7
    }

    getB(ui32) {
        // Shift bits to right 3 positions and grab 3 last
        return (ui32 >> 3) & 7
    }
    
    getC(ui32) {
        // grab 3 last bits
        return ui32 & 7
    }

    getOrthographyA(ui32) {
        return (ui32 >> 25) & 7
    } 

    getOrthographyValue(ui32) {
        return ui32 & 0x1FFFFFF
    }

    getPlatterAt(arrayIndex, finger) {
        return this.arrays[arrayIndex].getUint32(finger)
    }

    getRegister(n) {
        return this.registers[n].getUint32(0)
    }

    setRegister(n, value) {
        return this.registers[n].setUint32(0, value)
    }


    createPlatter(n) {
        const ab = new ArrayBuffer(n * 4); // Bytes
        const dv = new DataView(ab);
        return dv;
    }

    debug() {
        console.log("Finger; ",this.finger / 4)
        console.log("Current: ", this.currentPlatter.toString(16))
        const instruction = this.getInstruction(this.currentPlatter)
        if (instruction > 13) {
            console.log(instruction)
            throw new Error('Instruction', instruction);
        }
        console.log(`Instruction ${instruction}`)
        if (instruction == 13) {
            console.log(`Orthography reg -> ${this.getOrthographyA(this.currentPlatter)}`)
            console.log(`Value -> ${this.getOrthographyValue(this.currentPlatter)}`)
        } else {
            console.log(`   A: ${this.getA(this.currentPlatter)}`)
            console.log(`   B: ${this.getB(this.currentPlatter)}`)
            console.log(`   C: ${this.getC(this.currentPlatter)}`)
        }

        console.log("------")
        for (const [key, value] of Object.entries(this.registers)) {
            console.log(`R${key} : ${this.getRegister(key)}`);
        }
   
        console.log("*************************************")
        
    }
}