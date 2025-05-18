'use strict';

const Player = require('./player.js');
const hash = require('../shared/hash.js');
const { COUNTDOWN, SIMULATION_RATE /*POINTS_TO_WIN*/ } = require('../shared/constants.js');
const initialState = require('./initialState.json');
const simulate = require('../shared/simulate.js');
const copy = require('../shared/copy.js');
// const { relativeTimeThreshold } = require('moment');

function parseState(data, players) {
   const state = Object.create(null);
   // const paddleIds = Object.keys(players);
   // state.paddles = {};
   // if (data.paddles) {
   //    for (let i = 0; i < data.paddles.length; i++) {
   //       state.paddles[paddleIds[i]] = data.paddles[i];
   //       state.paddles[paddleIds[i]].name = players[paddleIds[i]].name;
   //       state.paddles[paddleIds[i]].accel = { x: 0, y: 0 };
   //    }
   // }
   if (data.ball) {
      state.ball = data.ball;
   }

   if (data.bound) {
      state.bound = data.bound;
   }

   if (data.goals) {
      state.goals = data.goals;
   }

   state.players = {};
   for (const playerId of Object.keys(players)) {
      const player = players[playerId];
      const team = player.team;
      let x, y;
      if (team === 'red') {
         x = state.bound.width / 4;
         y = state.bound.height / 2;
      } else {
         x = state.bound.width / 2 + state.bound.width / 4;
         y = state.bound.height / 2;
      }
      state.players[playerId] = {
         x,
         y,
         radius: 35,
         xv: 0,
         yv: 0,
         name: player.name,
         team,
         input: { right: false, up: false, left: false, down: false },
      };
   }
   // if (data.scores) {
   //    state.scores = {};
   //    for (let i = 0; i < paddleIds.length; i++) {
   //       state.scores[paddleIds[i]] = data.scores[i] || 0;
   //    }
   // }
   return state;
}

module.exports = class Room {
   constructor(data, id) {
      this.id = id;
      this.name = data.name;
      this.desc = data.desc;
      this.host = data.host || null;
      this.private = data.private || false;
      this.maxPlayers = data.maxPlayers;
      this._password = this.private ? hash(data.password) : null;
      this.state = 'chat';
      this.players = {};
      this.readyCount = 0;
      this.countdown = COUNTDOWN;
      this.pendingChatMessages = []; // [{ author: string, content: string }]
      this.pendingPrivateMessages = [];
      this.update = false;
      this.sendPackage = {};
      this.tick = 0;
      this.startTime = global.present();
      this.receivedInputs = [];
      this.states = [];
      this.inputs = [];
      this.stateUpdate = false;
      this.inputPackages = [];
      this.pendingChatNumbers = [];
      this.toDelete = false;
      this.teams = {
         red: [],
         blue: [],
      };
      this.wins = {
         red: 0,
         blue: 0,
      }
   }
   get playerCount() {
      return Object.keys(this.players).length;
   }
   get sentAllMessages() {
      return !(this.pendingChatMessages.length > 0);
   }
   get sentAllPrivateMessages() {
      return !(this.pendingPrivateMessages.length > 0);
   }
   talk(playerId, content) {
      this.pendingChatMessages.push({ author: playerId, content });
   }
   privateTalk(playerId, content) {
      this.pendingPrivateMessages.push({ author: playerId, content });
   }
   ready(playerId) {
      if (!this.players[playerId].ready) {
         this.readyCount++;
         this.update = true;
      }
      this.players[playerId].ready = true;
   }
   send(client) {
      if (!this.sentAllMessages) {
         client.send({ type: 'chat-update', messages: [...this.pendingChatMessages] });
      }
      if (!this.sentAllPrivateMessages) {
         const messages = [];
         for (const { author, content } of this.pendingPrivateMessages) {
            if (client.id === author) {
               messages.push({ author: 'SERVER', content });
            }
         }
         if (messages.length > 0) {
            client.send({ type: 'chat-update', messages });
         }
      }
      if (Object.keys(this.sendPackage).length > 0) {
         client.send({ ...this.sendPackage });
      }
   }
   resetAfterSend() {
      this.pendingChatMessages = [];
      this.pendingPrivateMessages = [];
      this.sendPackage = {};
   }
   createEmptyInputs() {
      const input = {};
      Object.keys(this.players).forEach((id) => {
         input[id] = { up: false, down: false, left: false, right: false };
      });
      return input;
   }
   gameState() {
      return this.states[this.tick];
   }
   updateRoom() {
      // idk maybe do some room updating
      if (
         this.readyCount === Object.keys(this.players).length &&
         Object.keys(this.players).length > 0 &&
         this.state !== 'game' &&
         !this.toDelete
      ) {
         this.state = 'game';
         this.countdown = COUNTDOWN;
         this.startTime = global.present();
         this.tick = 0;
         this.states = [{ ...parseState(initialState, this.players) }];
         this.inputs = [{ ...this.createEmptyInputs() }];
         this.receivedInputs = [];
         this.sendPackage['change'] = 'game';
         this.sendPackage['start'] = true;
         this.sendPackage['startTime'] = Number(global.format());
         this.sendPackage['initState'] = this.states[0];
         this.sendPackage['initInput'] = this.inputs[0];
      }
      if (this.state === 'game' && !this.toDelete) {
         this.gameUpdate();
      }
      if (this.toDelete) {
         this.sendPackage['change'] = 'rooms';
      }
   }
   handleInputs(inputs, playerId) {
      inputs.forEach((input) => {
         this.receivedInputs.push({ ...input, id: playerId });
      });
   }
   handleNumber(number, playerId) {
      this.pendingChatNumbers.push({ number, id: playerId });
   }
   sameInput(input1, input2) {
      return (
         input1.up === input2.up &&
         input1.down === input2.down &&
         input1.right === input2.right &&
         input1.left === input2.left
      );
   }
   gameUpdate() {
      const expectedTick = Math.ceil((global.present() - this.startTime) / (1000 / SIMULATION_RATE));
      const delta = 1 / SIMULATION_RATE;

      if (this.receivedInputs.length > 0) {
         this.sendPackage['inputs'] = [...this.receivedInputs];
      }

      if (this.pendingChatNumbers.length > 0) {
         this.sendPackage['chats'] = [...this.pendingChatNumbers];
         this.pendingChatNumbers = [];
      }

      this.receivedInputs.forEach((data) => {
         if (this.inputs[data.tick] === undefined) {
            this.inputs[data.tick] = Object.create(null);
         }
         this.inputs[data.tick][data.id] = data.input;
         this.tick = Math.min(this.tick, data.tick);
      });

      this.receivedInputs = [];

      while (this.tick < expectedTick) {
         // let onCountdown = false;
         // if (this.countdown > 0) {
         //    this.countdown -= delta;
         //    onCountdown = this.countdown > 0;
         // } else {
         //    this.countdown = 0;
         // }
         // if (!onCountdown) {
         // actual updating of the game!!!
         this.states[this.tick + 1] = simulate(
            this.states[this.tick],
            this.inputs[this.tick] === undefined ? {} : this.inputs[this.tick]
         );
         if (this.states[this.tick + 1].won) {
            const team = this.states[this.tick + 1].won;
            this.update = true;
            this.state = 'chat';
            this.sendPackage['change'] = 'chat';
            this.readyCount = 0;
            for (const player of Object.values(this.players)) {
               player.ready = false;
            }
            this.wins[team] += 1;
            this.talk('SERVER', `${team === 'blue' ? 'Red' : 'Blue'} team has won the game! (Red ${this.wins['red']} - Blue ${this.wins['blue']})`);
            // const scores = this.states[this.tick + 1].scores;
            // for (const id of Object.keys(scores)) {
            //    const score = scores[id];
            //    if (score === POINTS_TO_WIN) {
            //       this.state = 'chat';
            //       this.sendPackage['change'] = 'chat';
            //       this.readyCount = 0;
            //       for (const player of Object.values(this.players)) {
            //          player.ready = false;
            //       }
            //       this.update = true;
            //       const noobPlayer = this.players[Object.keys(scores).find((key) => scores[key] !== score)];
            //       this.players[id].wins++;
            //       this.talk(
            //          'SERVER',
            //          `${this.players[id].name} has won the game! ${noobPlayer.name} is noob. Score: ${score} - ${
            //             scores[noobPlayer.id]
            //          } `
            //       );
            //       this.talk(
            //          'SERVER',
            //          `Wins:${Object.values(this.players).reduce(
            //             (acc, player) => acc + `<br>	- ${player.name}: ${player.wins} wins`,
            //             ''
            //          )}`
            //       );
            //       break;
            //    }
            // }
         }
         // if (this.inputs[this.tick + 1] === undefined) {
         //    this.inputs[this.tick + 1] = Object.create(null);
         // }
         // } else {
         //    this.states[this.tick + 1] = copy(this.states[this.tick]);
         //    this.inputs[this.tick + 1] = copy(this.inputs[this.tick]);
         // }
         this.tick++;
      }
   }
   addPlayer(client) {
      this.update = true;
      this.players[client.id] = new Player(client);
      this.talk('SERVER', `${client.username} has joined!`);
      if (this.host) {
         this.privateTalk(client.id, `The host of the room is { ${this.players[this.host].name} }!`);
      }

      if (this.teams.red.length > this.teams.blue.length) {
         this.teams.blue.push(client.id);
         this.players[client.id].team = 'blue';
      } else if (this.teams.red.length < this.teams.blue.length) {
         this.teams.red.push(client.id);
         this.players[client.id].team = 'red';
      } else if (this.teams.red.length === this.teams.blue.length) {
         if (Math.random() < 0.5) {
            this.teams.red.push(client.id);
            this.players[client.id].team = 'red';
         } else {
            this.teams.blue.push(client.id);
            this.players[client.id].team = 'blue';
         }
      }
      console.log(this.teams);
   }
   initPack() {
      return {
         room: {
            name: this.name,
            private: this.private,
         },
         readyCount: this.readyCount,
         players: this.playerPack,
         maxPlayers: this.maxPlayers,
         playerCount: this.playerCount,
      };
   }
   updatePack() {
      return {
         room: {
            name: this.name,
         },
         teams: this.teams,
         readyCount: this.readyCount,
         players: this.playerPack,
         playerCount: this.playerCount,
         maxPlayers: this.maxPlayers,
      };
   }
   get playerPack() {
      const pack = {};
      for (const player of Object.values(this.players)) {
         pack[player.id] = player.pack();
      }
      return pack;
   }
   changeTeam(id, team) {
      this.update = true;
      this.players[id].team = team;
      if (team === 'red') {
         for (let i = 0; i < this.teams.blue.length; i++) {
            if (this.teams.blue[i] === id) {
               this.teams.blue.splice(i, 1);
               break;
            }
         }
         this.teams.red.push(id);
      } else if (team === 'blue') {
         for (let i = 0; i < this.teams.red.length; i++) {
            if (this.teams.red[i] === id) {
               this.teams.red.splice(i, 1);
               break;
            }
         }
         this.teams.blue.push(id);
      }
   }
   removePlayer(id) {
      this.update = true;
      if (this.players[id].ready) {
         this.readyCount--;
      }
      if (
         this.readyCount !== Object.keys(this.players).length &&
         Object.keys(this.players).length > 0 &&
         this.state === 'game'
      ) {
         this.state = 'chat';
         this.sendPackage['change'] = 'chat';
         this.readyCount = 0;
         for (const player of Object.values(this.players)) {
            player.ready = false;
         }
      }
      this.talk('SERVER', `${this.players[id].name} has left the game!`);
      const playersInTeam = this.teams[this.players[id].team];
      for (let i = 0; i < playersInTeam.length; i++) {
         const playerId = playersInTeam[i];
         if (id === playerId) {
            playersInTeam.splice(i, 1);
            console.log(this.teams);
            break;
         }
      }
      delete this.players[id];
      if (id === this.host) {
         this.toDelete = true;
      }
   }
   forfeit(id) {
      this.update = true;
      this.state = 'chat';
      this.sendPackage['change'] = 'chat';
      this.readyCount = 0;
      for (const player of Object.values(this.players)) {
         player.ready = false;
      }
      this.talk('SERVER', `${this.players[id].name} has forfeited the game! What a noob`);
   }
   finishUpdate() {
      this.update = false;
   }
   pack() {
      return {
         id: this.id,
         name: this.name,
         desc: this.desc,
         private: this.private,
         maxPlayers: this.maxPlayers,
         playerCount: this.playerCount,
      };
   }
};

/*
id: {
	name: string,
	desc: string,
	maxPlayers: number,
	private: bool,
	_password: string,
	state: string,
	...stateData,}
*/
