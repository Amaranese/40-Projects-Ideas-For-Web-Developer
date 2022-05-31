﻿using Microsoft.AspNetCore.Mvc;
using RPSLS.Game.Api.Data;
using System.Linq;
using System.Threading.Tasks;

namespace RPSLS.Game.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GamesController : ControllerBase
    {
        private readonly IMatchesRepository _resultDao;
        public GamesController(IMatchesRepository resultDao)
        {
            _resultDao = resultDao;
        }

        [HttpGet]
        public async Task<IActionResult> GetGamesByPlayer(string player, int limit=0)
        {
            var data = await _resultDao.GetLastGamesOfPlayer(player, limit);
            var humanGames = data.Select(c => c.PlayerMove.Value).ToList();
            var challengerGames = data.Select(c => c.ChallengerMove.Value).ToList();

            return Ok(new {
                humanGames,
                challengerGames
            });
        }

    }
}
