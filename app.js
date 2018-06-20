!function () {

    var scene = function () {
        var scene = new THREE.Scene();
        var light1 = new THREE.DirectionalLight(new THREE.Color('rgb(255,255,255)'));
        light1.position.set(2, 5, 3);
        var light2 = new THREE.AmbientLight(0xffffff);
        scene.add(light1);
        scene.add(light2);
        var plane = new THREE.GridHelper(10000, 100);
        scene.add(plane);

        return scene;
    }();


    var renderer = function () {
        var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.shadowMap.enabled = true;
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);
        return renderer;
    }();


    var camera = function () {
        var camera = new THREE.PerspectiveCamera(
            60, window.innerWidth / window.innerHeight, 1, 10000
        );
        camera.position.set(0, 500, 1500);

        var orbitControl = new THREE.OrbitControls(camera, renderer.domElement);
        orbitControl.addEventListener('change', render);
        return camera;
    }();

    function render() {
        renderer.render(scene, camera);
    };


    // model
    var model = {};

    function loadModel(callback) {
        [
            'base', 'link01', 'link02',
            'link03', 'link04', 'link05',
            'link06'
        ].forEach(function (e) {
            loadObject(e, function (object) {
                model[e] = object;
                if (Object.keys(model).length !== 7) return;
                modelLoaded();
                render();
                callback();
            });
        });
    };

    function modelLoaded() {
        /**
        var pivot = new THREE.Object3D();
        model.pivot = pivot;
        model.pivot.add(new THREE.AxesHelper(200));
        scene.add(pivot); */


        setPosition(model.link02, 13, 53, 19);
        setPosition(model.link03, 22, 118, 23);
        setPosition(model.link04, -28, 20, -30);
        setPosition(model.link05, 170, 2, 0);
        setPosition(model.link06, 0, 0, 0);



        model.link05.add(model.link06);
        model.link04.add(model.link05);
        model.link03.add(model.link04);
        model.link02.add(model.link03);
        model.link01.add(model.link02);
        model.base.add(model.link01);
        scene.add(model.base);

        link01 = new AutoRotation(model.link01, 'y', 1, 300, 30);
        link02 = new AutoRotation(model.link02, 'z', 1, 285, 65);
        link03 = new AutoRotation(model.link03, 'z', 1, 300, 50);
        link04 = new AutoRotation(model.link04, 'x', 1, 300, 50);
        link05 = new AutoRotation(model.link05, 'z', 1, 300, 50);

        // model.pivot.position.x = 300;
    };




    var link01, link02, link03, link04, link05, link06;


    function updateModel() {
        link01.rotate();
        link02.rotate();
        link03.rotate();
        link04.rotate();
        link05.rotate();
        var p = model.link06.getWorldPosition();
        data.push(p);
        updateLine();
    };

    function animate() {
        // if (!updateLine()) return;
        updateModel();
        render();
        requestAnimationFrame(animate);
    };

    var radToDeg = function (rad) {
        var reg = THREE.Math.radToDeg(rad);
        var result = Math.abs(reg) % 360;
        return result;
    };
    var degToRad = function () {
        var cache = {};
        return function (deg) {
            if (cache[deg]) return cache[deg];
            var rad = cache[deg] = THREE.Math.degToRad(deg);
            return rad;
        };
    }();

    var data = [];
    function loadDate(callback) {
        var scale = 1 / 8;
        loadJSON('mockData.json', function (result) {
            data = result.map(function (i) {
                ['x', 'y', 'z'].forEach(function (p) {
                    i[p] = i[p] * scale;
                });
                return i;
            });
            callback();
        });

    };

    !function start() {
        var dataLoaded = false;
        var modelLoaded = false;
        var after = function () {
            // if (dataLoaded && modelLoaded)
            animate();
        };
        /*        loadDate(function () {
                   dataLoaded = true;
                   after();
               }); */
        loadModel(function () {
            modelLoaded = true;
            after();
        });
    }();

    function AutoRotation(obj, axis, dlt, min, max) {
        var orgin = (max > min) ? (max + min) / 2 : (max + 360 + min) / 2;
        obj.rotation[axis] = degToRad(orgin);
        this.obj = obj;
        this.axis = axis;
        this.dlt = dlt;
        this.min = min;
        this.max = max;
    };
    AutoRotation.prototype.rotate = function () {
        var rad = this.obj.rotation[this.axis] += degToRad(this.dlt);
        var deg = radToDeg(rad);
        if (!checkRange(this.min, this.max, deg))
            this.dlt = this.dlt * -1;
    };


    // line
    var updateLine = function () {
        var lastIndex = null;
        return function updateLine() {
            if (data.length < 2) return;
            if (lastIndex == null && data.length === 2)
                lastIndex = 0;

            var lastLineEnd = data[lastIndex];
            var geometry = new THREE.Geometry();
            geometry.vertices.push(new THREE.Vector3(lastLineEnd.x, lastLineEnd.y, lastLineEnd.z));

            lastIndex++;
            lastLineEnd = data[lastIndex];
            if (!lastLineEnd) return;
            geometry.vertices.push(new THREE.Vector3(lastLineEnd.x, lastLineEnd.y, lastLineEnd.z));

            var material = new THREE.LineBasicMaterial({ color: 0xDF4949, linewidth: 5 });
            var line = new THREE.Line(geometry, material);
            line.position.z = 10;
            line.material.color.setHSL(Math.random(), 1, 0.5);

            geometry.verticesNeedUpdate = true;
            geometry.dynamic = true;
            scene.add(line);
            return true;
        };
    }();

    function setPosition(obj, x, y, z) {
        obj.position.x = x;
        obj.position.y = y;
        obj.position.z = z;
    };

    // 檢查角度是否在範圍內 逆時針計算
    function checkRange(start, end, checkTarget) {
        checkTarget = checkTarget % 360;
        start = start % 360;
        end = end % 360;
        if (end > start) {
            if (checkTarget < start || checkTarget > end)
                return false;
            return true;
        } else {
            if (checkTarget > start || checkTarget < end)
                return true;
            return false;
        }
    };

    function genNumber() {
        return (Math.random() - 0.5) * 10;
    };

    function roundFloat(num, pos) {
        var size = Math.pow(10, pos);
        return Math.round(num * size) / size;
    }

    function loadObject(filePath, callBack) {
        var onProgress = function (xhr) {
            if (false && xhr.lengthComputable) {
                var percentComplete = xhr.loaded / xhr.total * 100;
                console.log(Math.round(percentComplete, 2) + '% downloaded');
            }
        };

        var onError = function (xhr) { };

        THREE.Loader.Handlers.add(/\.dds$/i, new THREE.DDSLoader());

        var mtlLoader = new THREE.MTLLoader();
        mtlLoader.setPath('objs/');
        mtlLoader.load(filePath + '.mtl', function (materials) {

            materials.preload();

            var objLoader = new THREE.OBJLoader();
            objLoader.setMaterials(materials);
            objLoader.setPath('objs/');
            objLoader.load(filePath + '.obj', function (object) {
                object.traverse(function (node) {
                    if (node.material)
                        node.material.side = THREE.DoubleSide;
                });
                callBack(object);

            }, onProgress, onError);

        });
    };

    function loadJSON(path, callback) {

        var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
        xobj.open('GET', path, true); // Replace 'my_data' with the path to your file
        xobj.onreadystatechange = function () {
            if (xobj.readyState == 4 && xobj.status == "200") {
                // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
                callback(JSON.parse(xobj.responseText));
            }
        };
        xobj.send(null);
    };

}();
