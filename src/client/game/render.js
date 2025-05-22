'use strict';

const round = (value) => Math.round(value);
window.scaling = 1;
window.toScale = 1;
// const {  } = require('../../shared/constants.js');

// let phraseText = '';
// for (const [number, text] of Object.entries(phrases)) {
//    phraseText += ` ${number}. ${text} `;
// }

module.exports = function Render({ game, ctx, canvas }) {
   ctx.fillStyle = '#1f2229';//'#045200';
   ctx.fillRect(0, 0, canvas.width, canvas.height);

   // if (Math.abs(game.renderState.players[selfId].x - game.renderState.ball.x)*(1/scaling) > 400) {
   //    scaling -= 0.01;
   // } else if (Math.abs(game.renderState.players[selfId].y - game.renderState.ball.y)*(1/scaling) > 250) {
   //    scaling -= 0.01;
   // } else {
   //    scaling += 0.01;
   // }
   // if (scaling < 0.75) {
   //    scaling = 0.75;
   // }
   // if (scaling > 1) {
   //    scaling = 1;
   // }
   //  || Math.abs(game.renderState.players[selfId].y - game.renderState.ball.y)*(1/scaling) < 250

   if (game === undefined) return;

   if (game.state() != undefined && game.renderState != undefined && game?.renderState?.players[selfId] != undefined) {
      // scaling -= 0.01;
      toScale = 1;
      while (Math.abs(gameState.renderState.players[selfId].x - gameState.renderState.ball.x)*(toScale) > (800-100 - (gameState.renderState.ball.radius) - (gameState.renderState.players[selfId].radius))) {
            toScale -= 0.005;
      }
      while (Math.abs(gameState.renderState.players[selfId].y - gameState.renderState.ball.y)*(toScale) > (450-100 - (gameState.renderState.ball.radius) - (gameState.renderState.players[selfId].radius))) {
         toScale -= 0.005;
      }
      window.scaling = window.scaling + (window.toScale - window.scaling) * 0.05;
   }

   ctx.translate(canvas.width /2 , canvas.height / 2);
   ctx.scale(scaling, scaling)
   ctx.translate(-canvas.width /2 , -canvas.height / 2);
   // if (game.countdown !== undefined || game.countdownAlpha + 0.5 <= 0) {
   //    ctx.fillStyle = 'white';
   //    ctx.font = `65px Lexend`;
   //    ctx.textAlign = 'center';
   //    ctx.textBaseline = 'middle';
   //    ctx.globalAlpha = Math.max(0, game.countdownAlpha + 0.5);
   //    ctx.fillText(
   //       `${game.countdown <= 0 ? 'GO!' : window.debugMode ? game.countdown.toFixed(2) : Math.ceil(game.countdown)}`,
   //       canvas.width / 2,
   //       canvas.height / 4
   //    );
   //    // drawVs({
   //    //    ctx,
   //    //    canvas,
   //    //    name1: Object.values(game.state().paddles).find((paddle) => paddle.x < canvas.width / 2)?.name,
   //    //    name2: Object.values(game.state().paddles).find((paddle) => paddle.x > canvas.width / 2)?.name,
   //    //    game,
   //    // });
   //    ctx.globalAlpha = 1;
   // }
   if (game.state() !== undefined) {
      drawBound(game, { ctx });
      drawGoals(game, { ctx });
      drawBall(game, { ctx });
      drawPlayers(game, { ctx });
      // drawPaddles(game, game.countdown <= 0, { ctx });
      // drawScore(Object.values(game.state().scores)[0], Object.values(game.state().scores)[1], { ctx, canvas });
      // if (game.onChat) {
      //    drawChat({ ctx, canvas });
      // }
   }
   ctx.translate(canvas.width /2 , canvas.height / 2);
   ctx.scale(1/scaling, 1/scaling)
   ctx.translate(-canvas.width /2 , -canvas.height / 2);
};

function offset(x, y, game, canvas) {
   const player = game.renderState.players[selfId];
   const ball = game.renderState.ball;
   return {
      x: Math.round(x - (player.x + (ball.x - player.x) * 0.5) + canvas.width / 2),
      y: Math.round(y - (player.y + (ball.y - player.y) * 0.5) + canvas.height / 2),
   };
}


function drawGoals(game, { ctx }) {
   for (const goal of Object.values(game.state().goals)) {
      ctx.strokeStyle = goal.team === 'red' ? '#eb2d2d' : '#4157ba';
      const pos = offset(goal.x, goal.y, game, ctx.canvas);
      if (goal.team === 'red') {
         ctx.lineWidth = 8;
         ctx.beginPath();
         ctx.lineTo(pos.x+goal.width, pos.y);
         ctx.lineTo(pos.x, pos.y);
         ctx.lineTo(pos.x, pos.y+goal.height);
         ctx.lineTo(pos.x+goal.width, pos.y + goal.height);
         ctx.stroke();
      } else {
         ctx.lineWidth = 8;
         ctx.beginPath();
         ctx.lineTo(pos.x, pos.y);
         ctx.lineTo(pos.x+goal.width, pos.y);
         ctx.lineTo(pos.x+goal.width, pos.y+goal.height);
         ctx.lineTo(pos.x, pos.y + goal.height);
         ctx.stroke();
      }
      ctx.fillStyle = ctx.strokeStyle;
      ctx.globalAlpha = 0.25;
      ctx.fillRect(pos.x, pos.y, goal.width, goal.height);
      ctx.globalAlpha = 1;
   }
}

function drawBound(game, { ctx }) {
   const { x, y, width, height } = game.state().bound;
   ctx.fillStyle = '#323645'//'#3c9137';
   const pos = offset(x, y, game, ctx.canvas);
   ctx.fillRect(pos.x, pos.y, width, height);
   ctx.lineWidth = 4;
   ctx.strokeStyle = '#1f2229';//'#145e10';
   let amount = 2;
   ctx.globalAlpha = 0.1;
   // for (let y = 0; y < height; y += 140) {
   //    for (let x = 0; x < width; x += 140) {
   //       const pos = offset(x, y, game, ctx.canvas);
   //       ctx.strokeRect(pos.x, pos.y, 140, 140);
   //    }
   // }
   ctx.globalAlpha = 1;
   for (let y = 0; y < height; y += height / amount) {
      for (let x = 0; x < width; x += width / amount) {
         const pos = offset(x, y, game, ctx.canvas);
         ctx.strokeRect(pos.x, pos.y, width / amount, height / amount);
      }
   }
   // amount = 10;
   // ctx.globalAlpha = 0.5;
   // for (let y = 0; y < height; y += height / amount) {
   //    for (let x = 0; x < width; x += width / amount) {
   //       const pos = offset(x, y, game, ctx.canvas);
   //       ctx.strokeRect(pos.x, pos.y, width / amount, height / amount);
   //    }
   // }
   ctx.globalAlpha = 1;
}

function drawPlayers(game, { ctx }) {
   for (const playerId of Object.keys(game.renderState.players)) {
      const player = game.renderState.players[playerId];
      ctx.beginPath();
      ctx.strokeStyle = player.team === 'red' ? '#eb2d2d' : '#4157ba';
      ctx.fillStyle = 'black';
      ctx.lineWidth = 10;
      if (player.shift) {
         ctx.shadowBlur = 10;
      }
      ctx.shadowColor = ctx.strokeStyle;
      const pos = offset(player.x, player.y, game, ctx.canvas);
      ctx.arc(Math.round(pos.x), Math.round(pos.y), player.radius -ctx.lineWidth /2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fill();
      // ctx.shadowBlur = 0;
      ctx.fillStyle = 'white';////''black`';
      ctx.font = `${20 + (Math.round(player.radius) + 0.5) / 25 }px Inter`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(player.name, Math.round(pos.x), Math.round(pos.y + player.radius + player.radius / 3 + player.radius / 8));
      ctx.shadowBlur = 0;
      if (!player.shift) {
         // ctx.globalAlpha = 0.5;
         ctx.beginPath();
         ctx.strokeStyle = player.team === 'red' ? '#eb2d2d' : '#4157ba';
         // ctx.strokeStyle = '#7303fc';
         ctx.lineWidth = 5;
         // ctx.arc(Math.round(pos.x), Math.round(pos.y), player.radius/2- ctx.lineWidth/2, 0, (Math.PI * 2) );
         // ctx.stroke();
         ctx.globalAlpha = 1;
         ctx.beginPath();
         ctx.arc(Math.round(pos.x), Math.round(pos.y), player.radius/2- ctx.lineWidth/2, 0, (Math.PI * 2) * (1 - (player.shiftTimer/(120*5))) );
         ctx.stroke();
      }

      if (window.debugMode) {
         ctx.fillStyle = 'white';
         ctx.font = `${10}px Inter`
         ctx.fillText(player.ticksBehind, Math.round(pos.x), Math.round(pos.y));
      }
   }
}

function drawBall(game, { ctx }) {
   const ball = game.renderState.ball;
   const pos = offset(ball.x, ball.y, game, ctx.canvas);
   ctx.strokeStyle = '#ffffff';
   ctx.fillStyle = ctx.strokeStyle;
   // ctx.shadowBlur = 10;
   ctx.shadowColor = ctx.strokeStyle;
   ctx.lineWidth = 12;
   ctx.beginPath();
   ctx.arc(round(pos.x), round(pos.y), ball.radius-ctx.lineWidth/2, 0, Math.PI * 2);
   ctx.stroke();
   ctx.fill();
   ctx.shadowBlur = 0;
}

CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
   if (w < 2 * r) r = w / 2;
   if (h < 2 * r) r = h / 2;
   this.beginPath();
   this.moveTo(x + r, y);
   this.arcTo(x + w, y, x + w, y + h, r);
   this.arcTo(x + w, y + h, x, y + h, r);
   this.arcTo(x, y + h, x, y, r);
   this.arcTo(x, y, x + w, y, r);
   this.closePath();
   return this;
};
CanvasRenderingContext2D.prototype.fillStroke = function () {
   this.fill();
   this.stroke();
};
