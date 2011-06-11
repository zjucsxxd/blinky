window.onload = function() {

   // size of usable area
   var w = 400;
   var h = 400;

   // RaphaelJS object
   var R = Raphael("figure",w,h);

   // camera
   var cam = { x:w/2, y:h/2+40, r:5 };
   var camVis = R.circle(cam.x, cam.y, cam.r)
      .attr({fill:"#000"});
   var camText = R.text(cam.x + cam.r + 20, cam.y, "camera");

   // 1D screen
   var screen = { x:w/2, y:h/2, width:w/2};
   var screenVis = R.path([ "M", screen.x - screen.width/2, screen.y, "h", screen.width])
      .attr({opacity:"0.5"});
   var screenText = R.text(screen.x + screen.width/2 + 20, screen.y, "screen");

   // math utilities
   var bound = function(x,min,max) { return Math.min(Math.max(x,min),max); };
   var sign = function(x) { return x < 0 ? -1 : 1; };

   // class to represent a colored ball 
   var ObjType = function(x,y,radius,color) 
   {
      // obj represents the current instance of this ObjType
      var obj = this;

      // create the position and radius
      obj.x = x;
      obj.y = y;
      obj.r = radius;

      // create the visual circle 
      obj.circle = R.circle(x,y,radius)
         .attr({fill:color,stroke:"none"})
         .drag(
               // the "this" pointer refers to the circle object
               // "this.ox" and "this.oy" represent the original location before dragging

               // onmove
               function(dx,dy) {
                  obj.x = bound(this.ox + dx, 0, w);
                  obj.y = bound(this.oy + dy, 0, h);
                  this.attr({cx:obj.x, cy:obj.y});
                  obj.update();
               },

               // onstart
               function() {
                  this.ox = this.attrs.cx;
                  this.oy = this.attrs.cy;
               },

               // onend
               function () {
                  // useful for creating initial position
                  // alert([obj.x, obj.y]);
               });

      // create the visual cone
      obj.cone = R.path()
         .attr({fill:color, opacity:"0.3", stroke:"none"});

      // create the visual 1D image
      obj.image = R.path()
         .attr({"stroke-width":"4px", stroke:color});

      // updates the position of the cone and the image depending on the circle
      obj.update = function() {

          //            * (obj.x,obj.y)
          //            |\
          //      obj.r | \ dist
          //            |  \
          //            |___\
          //  (cx1,cy1) *    * (cam.x,cam.y)

          // -------------------
          // algorithm:
          //   The diagram illustrates how to find the viewing cone of a circle.
          //   The (cx1,cy1) represents the cone end point, which is tangent
          //   to the circle.  This means the angle at that corner of the triangle
          //   is 90 degrees.
          //   Now we imagine that the object is vertically aligned with the camera.
          //   In this new frame, the y-coordinate of the cone point is equal to
          //   r * cos(theta), where theta is the angle at the object center.
          //   The x-coordinate is r * sin(theta).
          //   We must then rotate this cone point back to our original coordinate frame.

          // distances between camera and object
          var dx = obj.x - cam.x;
          var dy = obj.y - cam.y;
          var dist = Math.sqrt(dx*dx+dy*dy);

          // cone point on vertically aligned unit circle
          var ry = obj.r/dist; // cos(theta)
          var rx = Math.sqrt(1-ry*ry); // r * sin = sqrt(1-cos^2)

          // scale cone point up to the object's perimeter
          rx *= obj.r;
          ry *= obj.r;

          // create the inverse rotation frame
          var ex = [dy/dist, -dx/dist]; 
          var ey = [-dx/dist, -dy/dist];

          // apply inverse rotation for the cone's absolute endpoints
          var cx1 = obj.x + ex[0]*rx + ey[0]*ry; 
          var cy1 = obj.y + ex[1]*rx + ey[1]*ry;
          var cx2 = obj.x - ex[0]*rx + ey[0]*ry;
          var cy2 = obj.y - ex[1]*rx + ey[1]*ry;

          // update object's visual cone
          obj.cone.attr({path:["M",cam.x,cam.y,"L",cx1,cy1,"L",cx2,cy2,"Z"]});

          // calculate object's 1D screen image
          var ix1 = (cx1-cam.x)/(cy1-cam.y)*(screen.y-cam.y) + cam.x;
          var ix2 = (cx2-cam.x)/(cy2-cam.y)*(screen.y-cam.y) + cam.x;
          if (cy1 >= cam.y) { ix1 = sign(cx1-cam.x) * Infinity; }
          if (cy2 >= cam.y) { ix2 = sign(cx2-cam.x) * Infinity; }
          ix1 = bound(ix1,screen.x - screen.width/2,screen.x+screen.width/2);
          ix2 = bound(ix2,screen.x - screen.width/2,screen.x+screen.width/2);

          // hide image if object is behind camera
          if (obj.y-obj.r > cam.y) {
             obj.image.hide();
          }
          else {
             obj.image.show();
          }

          // update object's 1D screen image
          obj.image.attr({path:["M",ix1,screen.y,"H",ix2]});
      };

      // insert cone behind circle so drag events are not blocked
      obj.cone.insertBefore(obj.circle);

      // initialize cone and image positions
      obj.update();
   };

   var blue = "#5D8AA8";
   var red = "#E32636";
   var green = "#556B2F";

   // create the colored balls
   new ObjType(130, 174, 20, red);
   new ObjType(206, 152, 20, green);
   new ObjType(308, 164, 20, blue);
}