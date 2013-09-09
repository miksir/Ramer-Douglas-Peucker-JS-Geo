var simplifyGeoPath = function (points, tolerance) {
    var R = 6367444.6571225;

    var GeoLine = function (p1, p2) {
        this.A = p1;
        this.B = p2;
        this.distanceToPoint = function (point) {
            var A = new Vector(this.A),
                B = new Vector(this.B),
                C = new Vector(point);

            var G = A.Product(B);
            var F = C.Product(G);
            var T = G.Product(F);

            T = T.getNormal().multiplyByScalar(R).getPoint();

            return T.geoDistanceToPoint(point);
        };
    };

    var Line = function (p1, p2) {
        this.A = new GeoPoint(p1);
        this.B = new GeoPoint(p2);
    };
    Line.prototype = GeoLine;

    var Point = function () {
        this.cartesian = false;
        this.geo = false;

        this.setGeo = function (p) {
            this.lat = p[0];
            this.lon = p[1];
            this.geo = true;
            this.cartesian = false;
        };

        this.setCartesian = function (p) {
            this.x = p[0];
            this.y = p[1];
            this.z = p[2];
            this.cartesian = true;
            this.geo = false;
        };

        this.getCartesian = function () {
            if (!this.cartesian) {
                this.x = R * Math.cos(this.deg2rad(this.lat)) * Math.cos(this.deg2rad(this.lon));
                this.y = R * Math.cos(this.deg2rad(this.lat)) * Math.sin(this.deg2rad(this.lon));
                this.z = R * Math.sin(this.deg2rad(this.lat));
                this.cartesian = true;
            }
            return this;
        };

        this.getGeo = function () {
            if (!this.geo) {
                this.lat = this.rad2deg(Math.asin(this.z / R));
                this.lon = this.rad2deg(Math.atan2(this.y, this.x));
                this.geo = true;
            }
            return this;
        };

        this.geoDistanceToPoint = function (point) {
            this.getGeo();
            point.getGeo();
            return R * 2 *
                Math.asin(
                    Math.sqrt(
                        this.pow(Math.sin(this.deg2rad(Math.abs(point.lat - this.lat) / 2)), 2) +
                            Math.cos(point.lat) *
                                Math.cos(this.lat) *
                                this.pow(Math.sin(this.deg2rad(Math.abs(point.lon - this.lon) / 2)), 2)
                    )
                );
        };

        this.deg2rad = function (a) {
            return a / 180 * Math.PI;
        };

        this.rad2deg = function (a) {
            return a * 180 / Math.PI;
        };
    };

    var Vector = function (point) {
        this.point = point;

        this.Product = function (point) {
            var A = this.point.getCartesian();
            var B = point.getCartesian();
            //i(y1z2 - z1y2) - j(x1z2 - z1x2) + k(x1y2 - y1x2)
            var c = [
                A.y * B.z - A.z * B.y,
                0 - (A.x * B.z - A.z * B.x),
                A.x * B.y - A.y * B.x
            ];
            this.point.setCartesian(c);
            return this;
        };

        this.getLength = function () {
            var A = this.point.getCartesian();
            return Math.sqrt(A.x * A.x + A.y * A.y + A.z * A.z);
        };

        this.getNormal = function () {
            var A = this.point.getCartesian();
            var length = this.getLength();
            var c = [
                A.x / length,
                A.y / length,
                A.z / length
            ];
            this.point.setCartesian(c);
            return this;
        };

        this.multiplyByScalar = function (sc) {
            var A = this.point.getCartesian();
            var c = [
                A.x * sc,
                A.y * sc,
                A.z * sc
            ];
            this.point.setCartesian(c);
            return this;
        };

        this.getPoint = function () {
            return this.point;
        };
    };

    var GeoPoint = function (p) {
        this.setGeo(p);
    };
    GeoPoint.prototype = Point;

    var CartesianPoint = function (p) {
        this.setCartesian(p);
    };
    CartesianPoint.prototype = Point;

    var douglasPeucker = function (points, tolerance) {
        if (points.length <= 2) {
            return [points[0]];
        }
        var returnPoints = [],
        // make line from start to end
            line = new Line(points[0], points[points.length - 1]),
        // find the largest distance from intermediate points to this line
            maxDistance = 0,
            maxDistanceIndex = 0,
            p;

        for (var i = 1; i <= points.length - 2; i++) {
            var distance = line.distanceToPoint(points[ i ]);
            if (distance > maxDistance) {
                maxDistance = distance;
                maxDistanceIndex = i;
            }
        }

        // check if the max distance is greater than our tolerance allows
        if (maxDistance >= tolerance) {
            p = points[maxDistanceIndex];
            line.distanceToPoint(p, true);
            // include this point in the output
            returnPoints = returnPoints.concat(douglasPeucker(points.slice(0, maxDistanceIndex + 1), tolerance));
            // returnPoints.push( points[maxDistanceIndex] );
            returnPoints = returnPoints.concat(douglasPeucker(points.slice(maxDistanceIndex, points.length), tolerance));
        } else {
            // ditching this point
            p = points[maxDistanceIndex];
            line.distanceToPoint(p, true);
            returnPoints = [points[0]];
        }
        return returnPoints;
    };

    var arr = douglasPeucker(points, tolerance);

    // always have to push the very last point on so it doesn't get left off
    arr.push(points[points.length - 1 ]);

    return arr;
};
