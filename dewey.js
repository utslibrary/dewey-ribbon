behaviors.deweyRibbon = {
    els: {
      wrapper: {
        attrs: {
          id: "call-numbers-widget",
          class: "span12 call-numbers-wrapper clearfix"
        },
        css: {
          position: "relative"
        }
      },
      stats: {
        attrs: {
          id: "call-numbers-stats",
          class: "call-numbers-stats"
        },
        css: {
          textAlign: "center",
          fontSize: 12,
          color: "#ccc",
          position: "absolute",
          fontWeight: "bold",
          right: 0,
          bottom: -2,
          display: "none"
        }
      }
    },

    onClick: function(event) {
      var $this = $(this),
        title = $this.attr("title");
      if (!title && $this.data("original-title")) {
        title = $this.data("original-title");
      }
      window._gaq.push(["_trackEvent", "Dewey_Bar", "Click", title]);
    },

    getEl: function(el) {
      if (this.els[el] && !this.els[el]._el) {
        this.els[el]._el = $("<div>").attr(this.els[el].attrs);
        this.els[el]._el.css(this.els[el].css);
      } else {
        return $("<div>");
      }
      return this.els[el]._el;
    },

    getParamsWith: function(key, value) {
      // create URL
      var index = window.location.href.indexOf("?"),
        urlGen = new endeca.UrlGen(
          index !== -1 ? window.location.href.substring(index + 1) : ""
        ),
        val = urlGen.getParam(key) || "",
        prev = urlGen.getParam("_prev" + key),
        vals = $.grep(val.split("+"), function(v) {
          return v && (v != prev && v != value);
        });

      // add current
      vals.push(value);

      val = vals.join("+");

      // set param
      urlGen.addParam(key, val);

      // store current
      urlGen.addParam("_prev" + key, vals.pop());

      var params = urlGen.toString();
      if (params.charAt(0) === "&") {
        params = params.substring(1);
      }

      return params;
    },

    formatNumber: function(x) {
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    processResponse: function($ribbon, settings, data) {
      var callNo,
        total = 0,
        $stats = this.getEl("stats"),
        $div = this.getEl("wrapper"),
        callNos = $.map(
          data.suggestions || [],
          $.proxy(function(item, index) {
            // filter results
            if (/[0-9]{3} .*/.test(item.name)) {
              total += parseInt(item.count);

              var callNo = item.name.substr(0, 3),
                count = parseInt(item.count);

              return {
                callNo: callNo,
                digits: [
                  parseInt(callNo.substr(1, 1)),
                  parseInt(callNo.substr(2, 1))
                ],
                name: item.name,
                count: count,
                countFormatted: this.formatNumber(count),
                id: item.id
              };
            }
          }, this)
        );

      $div.append($stats);

      if (callNos.length) {
        var current;
        for (var i in callNos) {
          current = callNos[i];

          if (!(current && current.id && current.count)) continue;

          // call number
          callNo = current.callNo;

          // calculate width
          var width = Math.floor((current.count * 10000) / total) / 100,
            href =
              settings.contextPath +
              "/" +
              settings.controller +
              "?" +
              this.getParamsWith("N", current.id);

          var $a = $("<a />")
            .attr("href", href)
            .attr("title", current.name)
            .attr("data-call-number", callNo)
            .addClass("call-numbers call-numbers-" + callNo)
            .css({ width: width + "%" })
            .tooltip();

          $a.hover(
            $.proxy(
              function() {
                $stats
                  .stop(true, true)
                  .text(this.text + " items")
                  .fadeIn("slow");
              },
              { text: current.countFormatted }
            ),
            function() {
              $stats
                .stop(true, true)
                .text("")
                .fadeOut("slow");
            }
          ).on("click", this.onClick);

          var xxx = current.digits.pop(),
            xx = current.digits.pop();

          if (xxx) {
            $a.addClass("call-numbers-xx" + xxx);
          } else if (xx) {
            $a.addClass("call-numbers-x" + xx + "x");
          }

          $div.append($a.append($("<span>").css("position", "relative")));
        }
        $ribbon.append($div);
      } else {
        $ribbon.remove();
      }
    },

    attach: function(context, settings) {
      if (!this.$ || !settings.callNum) {
        return;
      }

      var $ribbon = this.$.once(context);

      if (!($ribbon && $ribbon.length)) return;

      var self = this,
        url =
          settings.contextPath +
          "/" +
          settings.callNum.service +
          window.location.search;

      $.getJSON(url, { dimName: settings.callNum.dimName }, function(data) {
        self.processResponse($ribbon, settings, data);
      });
    }
  };
