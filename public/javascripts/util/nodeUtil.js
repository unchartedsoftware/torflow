/**
* Copyright © 2015 Uncharted Software Inc.
*
* Property of Uncharted™, formerly Oculus Info Inc.
* http://uncharted.software/
*
* Released under the MIT License.
*
* Permission is hereby granted, free of charge, to any person obtaining a copy of
* this software and associated documentation files (the "Software"), to deal in
* the Software without restriction, including without limitation the rights to
* use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
* of the Software, and to permit persons to whom the Software is furnished to do
* so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/

module.exports = {

    getCurrentTotalBandwidth : function(nodes) {
        var totalBandwidth = 0;
        nodes.objects.forEach(function(aggregate) {
            aggregate.circle.relays.forEach(function(relay) {
                totalBandwidth+=relay.bandwidth;
            });
        });
        return totalBandwidth;
    },

    sumRelaysBandwidth : function(relays) {
        return _.reduce(relays, function(memo, relay) {
                return memo + relay.bandwidth;
            }, 0);
    },

    getNormalizedBandwidth : function(relays,nodes) {
        return this.sumRelaysBandwidth(relays) / this.getCurrentTotalBandwidth(nodes);
    },

    getMinMaxBandwidth : function(nodes) {
        var max = -Number.MAX_VALUE;
        var min = Number.MAX_VALUE;
        var self = this;
        nodes.objects.forEach(function(node) {
            var nodeBW = self.sumRelaysBandwidth(node.circle.relays);
            max = Math.max(max,nodeBW);
            min = Math.min(min,nodeBW);
        });
        return {
            min: min,
            max: max
        };
    },

};
