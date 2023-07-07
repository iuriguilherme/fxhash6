/**!
 * @file fxhash6  
 * @version 0.1.0  
 * @copyright Iuri Guilherme 2023  
 * @license GNU AGPLv3  
 * @author Iuri Guilherme <https://iuri.neocities.org/>  
 * @description This is fxhash6 made with p5js for 
 *  fxhash.xyz generative tokens. Source code available at Github: 
 *  https://github.com/iuriguilherme/fxhash6  
 * 
 * This program is free software: you can redistribute it and/or modify it 
 * under the terms of the GNU Affero General Public License as published by the 
 * Free Software Foundation, either version 3 of the License, or (at your 
 * option) any later version.  
 * 
 * This program is distributed in the hope that it will be useful, but WITHOUT 
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or 
 * FITNESS FOR A PARTICULAR PURPOSE.  
 * See the GNU Affero General Public License for more details.  
 * 
 * You should have received a copy of the GNU Affero General Public License 
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.  
 * 
 */

/*
 * 
 *    ▄████████ ▀████    ▐████▀    ▄█    █▄       ▄████████  ▄████████    ▄█   ▄█▄    ▄████████     ███        ▄█    █▄     ▄██████▄  ███▄▄▄▄   
 *   ███    ███   ███▌   ████▀    ███    ███     ███    ███ ███    ███   ███ ▄███▀   ███    ███ ▀█████████▄   ███    ███   ███    ███ ███▀▀▀██▄ 
 *   ███    █▀     ███  ▐███      ███    ███     ███    ███ ███    █▀    ███▐██▀     ███    ███    ▀███▀▀██   ███    ███   ███    ███ ███   ███ 
 *  ▄███▄▄▄        ▀███▄███▀     ▄███▄▄▄▄███▄▄   ███    ███ ███         ▄█████▀      ███    ███     ███   ▀  ▄███▄▄▄▄███▄▄ ███    ███ ███   ███ 
 * ▀▀███▀▀▀        ████▀██▄     ▀▀███▀▀▀▀███▀  ▀███████████ ███        ▀▀█████▄    ▀███████████     ███     ▀▀███▀▀▀▀███▀  ███    ███ ███   ███ 
 *   ███          ▐███  ▀███      ███    ███     ███    ███ ███    █▄    ███▐██▄     ███    ███     ███       ███    ███   ███    ███ ███   ███ 
 *   ███         ▄███     ███▄    ███    ███     ███    ███ ███    ███   ███ ▀███▄   ███    ███     ███       ███    ███   ███    ███ ███   ███ 
 *   ███        ████       ███▄   ███    █▀      ███    █▀  ████████▀    ███   ▀█▀   ███    █▀     ▄████▀     ███    █▀     ▀██████▀   ▀█   █▀  
 *                                                                       ▀
 * 
*/

import final from "./final";
import minting from "./minting";

$fx.params([
  {
    id: "turning",
    name: "Maximum turning angle",
    type: "number",
    update: "code-driven",
    default: 0.05,
    options: {
      min: 0.0,
      max: 1.0,
      step: 0.01,
    },
  },
  {
    id: "mutation",
    name: "Mutation Rate",
    type: "number",
    update: "code-driven",
    default: 0.05,
    options: {
      min: 0.0,
      max: 1.0,
      step: 0.01,
    },
  },
  {
    id: "population",
    name: "Population",
    type: "number",
    update: "code-driven",
    default: 100,
    options: {
      min: 1,
      max: 300,
      step: 1,
    },
  },
]);

// we add the context as a class to the body, this way we can fine-tune the
// elements in CSS based on the context
document.body.classList.add($fx.context);

// the piece is executed in "minting" mode; so we need to display a custom
// minting interface; this can be anything, it doesn't have to be some code
// running separately; it can also be some interface layered on top of the
// final output
if ($fx.context === "minting") {
  minting(); // see minting.js for implementation
}
// the piece is ran by itself, for the final output or for the capture
// for instance - in such a case we render the final output based on the inputs
else {
  // $fx.context === "standalone" || $fx.context === "capture"
  final(); // see final.js for implementation
}

//~ window.$fxhashFeatures = {
  //~ "Bezier Curves": featureVariant
//~ }
