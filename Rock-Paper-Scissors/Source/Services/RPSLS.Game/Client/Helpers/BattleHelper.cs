﻿namespace RPSLS.Game.Client.Helpers
{
    public class BattleHelper
    {
        public static string GetAnimatedClass(bool isShaking)
        {
            if (isShaking)
            {
                return "animated";
            }
            else
            {
                return "animated-end";
            }
        }

        public static string GetHandIcon(int challengerPick)
        {
            var hand = challengerPick.ToString();
            if (hand == "3")
            {
                return $"{hand}_animated";
            }
            return hand;
        }

        public static string MapPick(int pick)
        {
            return pick switch
            {
                0 => "rock",
                1 => "paper",
                2 => "scissors",
                3 => "lizard",
                4 => "spock",
                _ => "-"
            };
        }

        public static int MapPick(string pick)
        {
            if (int.TryParse(pick, out int result))
                return result;

            return pick.ToLowerInvariant() switch
            {
                "rock" => 0,
                "paper" => 1,
                "scissors" => 2,
                "lizard" => 3,
                "spock" => 4,
                _ => -1
            };
        }

    }
}
