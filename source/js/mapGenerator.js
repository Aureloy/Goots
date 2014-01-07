materials = {

	grass : 
	{
		thickness: 200
		,minOffset : 150
		,maxOffset : 250
		
		,height_variation_factor : 10
		,plateau_factor : 15
		,smoothness : 0.2
		
		,noise_factor : 0.3
		,noise_height : 1
		
		,rgb : { r: 0, g : 150, b : 0}
		
		,previousMaterial : false
		
		,lodes : {
			size : 0
			,amountPercent : 0
			,spreadOffset : 0
		}
	}
	
	,mud : 
	{
		thickness: 25
		,minOffset : 20
		,maxOffset : 30
		
		,height_variation_factor : 3
		,plateau_factor : 1
		,smoothness : 0.3
		
		,previousMaterial : "grass"

		,noise_factor : 0.1
		,noise_height : 1
		
		,rgb : { r: 150, g : 75, b : 0}
		
		,lodes : {
			size : 20
			,amountPercent : 0.3
			,spreadOffset : 100
		}
	}
	
	,dirt : 
	{
		thickness: 50
		,minOffset : 45
		,maxOffset : 100
		
		,height_variation_factor : 10
		,plateau_factor : 10
		,smoothness : 0.8
		
		,previousMaterial : "mud"
		
		,noise_factor : 0.7
		,noise_height : 1
		
		,rgb : { r: 75, g : 50, b : 50}
		
		,lodes : {
			size : 15
			,amountPercent : 0.5
			,spreadOffset : 150
		}
	}
	,stone :
	{
		thickness: 120
		,minOffset : 50
		,maxOffset : 50
		
		,height_variation_factor : 8
		,plateau_factor : 5
		,smoothness : 0
		
		,previousMaterial : "dirt"
		
		,noise_factor : 0.7
		,noise_height : 1
		
		,rgb : { r: 50, g : 25, b : 25}
		
		,lodes : {
			size : 25
			,amountPercent : 1
			,spreadOffset : 200
		}
	}
	,darkstone :
	{
		thickness: 250
		,minOffset : 0
		,maxOffset : 0
		
		,height_variation_factor : 5
		,plateau_factor : 1
		,smoothness : 0.5
		
		,previousMaterial : "stone"
		
		,noise_factor : 0.5
		,noise_height : 1
		
		,rgb : { r: 25, g : 10, b : 10}
		
		,lodes : {
			size : 20
			,amountPercent : 0.6
			,spreadOffset : 250
		}
	}
	,granit :
	{
		thickness: 1200
		,minOffset : 0
		,maxOffset : 0
		
		,height_variation_factor : 0
		,plateau_factor : 0
		,smoothness : 0
		
		,previousMaterial : "darkstone"
		
		,noise_factor : 0
		,noise_height : 0
		
		,rgb : { r: 5, g : 5, b : 5}
		
		,lodes : {
			size : 30
			,amountPercent : 0.8
			,spreadOffset : 400
		}
	}
};



function init()
{
	element = document.getElementById("map");
	c = element.getContext("2d");

	mapWidth = element.width;
	mapHeight = element.height;
	
	
	$('#storeMap').click(function(){

		try 
		{
			localStorage.map = JSON.stringify(mapBinary);
			alert('Map enregistrée');
		}
		catch (e) 
		{
			delete localStorage.map;
			alert('Map non enregistrée : dépassement de mémoire');
		}
	});


	$('#loadMap').click(function(){

		if(localStorage.map == undefined || !localStorage.map)	
		{
			alert("Aucune map trouvée en mémoire");
			return false;
			
		}
		mapBinary = JSON.parse(localStorage.map);
		drawMap();
	});

	$('#generateMap').click(function(){
		generateMap();
	});

	$('#eraseMap').click(function(){
		delete localStorage.map;
		alert('Map effacée de la mémoire');
	});
	
	$('#toPNG').click(function()
	{
		element = document.getElementById("map");
		var d=element.toDataURL("image/png");
		$('#imgZone').attr('src',d);
	});
	
}



function generateMap()
{

	var start = Date.now();

	// instanciation des variables de fonctionnement 
	
	mapBinary = new Object();
	initialMaterialsHeight = new Object();
	newMaterialsHeight = new Object();
	parentMaterialsHeight = new Object();
	oldParentMaterialsHeight  = new Object();
	
	// définition de la hauteur initiale de chaque materiau ( colonne de gauche )
	generateMaterialInitHeight();
	
	// pour chaque colonne	
	for(x = 0; x < mapWidth; x++)
	{
		mapBinary[x] = new Array();
		
		// calcul de la hauteur des différents matériaux
		generateMaterialsHeight();
		
		// on place dans un buffer la hauteur calculée, pour la prochaine itération
		oldParentMaterialsHeight = parentMaterialsHeight;
		
		// on attribue le matériau à chaque pixel en fonction de la hauteur des différents materiaux calculés
		setColumnMaterial(x);
	}
	
	
	
	// 2eme itération : veines de matériaux
	generateLodes();
	
	// 3eme itération : caves
	generateCaves();
	
	// une fois la map générée, on la dessine
	drawMap();
	
	var end = Date.now();

	getStats(end - start);
}

// calcule la hauteur initiale des matériaux sur la 1ere colonne
function generateMaterialInitHeight()
{
	for(m in materials)
	{
		mat = materials[m];
		
		initialMaterialsHeight[m] = newMaterialsHeight[m] = mat.thickness
			+ Math.round( Math.random() * mat.height_variation_factor )
			* ( Math.random() > 0.5 ? 1 : - 1 );
	}
}

// calcule la hauteur des différentes couches de matériaux sur une colonne
function generateMaterialsHeight()
{
	// pour chaque matériaux
	for(m in materials)
	{
		mat = materials[m];
		
		// on récupère la hauteur précédente afin de garder une continuité dans le paysage
		parentMaterialsHeight[m] = getParentMaterialsHeight(m, newMaterialsHeight);
		 
		// si le materiau doit changer de taille
		if(mat.smoothness == 0 || Math.random() > mat.smoothness || oldParentMaterialsHeight[m] == undefined )
		{
			// on génère une nouvelle hauteur	// en fonction de la variation
			newMaterialsHeight[m] += Math.floor(Math.pow( Math.random(), mat.plateau_factor) * mat.height_variation_factor) 
				// on vérifie qu'elle de sorte pas du cadre de restriction
				* ( newMaterialsHeight[m] < ( mat.thickness - mat.minOffset ) ? 1 : ( newMaterialsHeight[m] > ( mat.thickness + mat.maxOffset ) ? - 1 : (Math.random() > 0.5 ? 1 : - 1 ) ) )
				// et ajoute du bruit pour la variation
				+ ( Math.random() < mat.noise_factor ? (Math.random() > 0.5 ? 1 : - 1 ) * mat.noise_height : 0 );
		}
		else
		{
			// sinon le matériau reste à la même hauteur que précédemment, avec la contrainte de respet du matériau parent.
			newMaterialsHeight[m] -= parentMaterialsHeight[m] - oldParentMaterialsHeight[m];
		}
	}
}



// fonction récursive qui retourne la hauteur des matériaux parents 
function getParentMaterialsHeight(m, newMaterialsHeight)
{
	return ( materials[m].previousMaterial != false ? newMaterialsHeight[materials[m].previousMaterial] + getParentMaterialsHeight(materials[m].previousMaterial, newMaterialsHeight) : 0 );
}


// fonction qui alloue tous les pixels d'une colonne en fonction des matériaux calculés
function setColumnMaterial(x)
{
	for(m in materials)
	{
		// point de départ : si pas de matériau parent, on démarre à la hauteur du materiau, sinon on rempli depuis le parent + 1
		var startPoint = ( oldParentMaterialsHeight[m] == 0 ? newMaterialsHeight[m] : oldParentMaterialsHeight[m] + 1) ;
		// point d'arrivée : le minimum entre la hauteur calculée et les limite de la map
		var endPoint = Math.min( newMaterialsHeight[m] + oldParentMaterialsHeight[m], mapHeight );
		
		for(y = startPoint; y <= endPoint; y++)
		{
			mapBinary[x][y] = m;
		}
	}
}





// fonction qui dessine des poches de matériaux 

function generateLodes()
{
	// pour chaque materiau
	for(m in materials)
	{
		// on détermine le nombre de veines à placer sur la map
		var lodeNumber = Math.round(materials[m].lodes.amountPercent * mapHeight);
		if(!lodeNumber) continue;
		
		// on détermine la hauteur moyenne du materiau
		var averageY = getParentMaterialsHeight(m, initialMaterialsHeight);
		
		// pour chaque veine
		for(i = 0; i <= lodeNumber; i++)
		{
			// on détermine une position de départ en fonction de la largeur de la map
			lodeX = Math.round(Math.random() * mapWidth + 1);
			// on détermine une position de départ en fonction de la hauteur de la couche et du coefficient de spread
			lodeY = averageY + (Math.random() > 0.2 ? 1 : -1 ) * Math.round( Math.random() * materials[m].lodes.spreadOffset / 2 + 1);
			
			// algo a déterminer pour faire une poche réaliste
			// lineLengthX = new Array();
			// lineLengthY = new Array();
			
			squareSize = Math.round(materials[m].lodes.size);
			
			for(iX = -squareSize; iX <= squareSize; iX++)
			{
				if (iX % mapWidth  == 0) 
				{
					noise.seed(Math.random());
				}
				
				for(iY = -squareSize; iY <= squareSize; iY++)
				{
					// out of bounds
					if(mapBinary[lodeX + iX] == undefined)
					{
						continue;
					}
					
					// out of bounds ou dans le ciel
					if(mapBinary[lodeX + iX][lodeY + iY] == undefined)
					{
						continue;
					}
					
					// on force une couche de végétation en haut //
					if(mapBinary[lodeX + iX][lodeY + iY] == "grass")
					{
						continue;
					}
					
					var active = Math.abs(noise.perlin2(iX / 20, iY / 20 ));
					active = (active > 0.50 ? 1 : 0);
					
					if(!active)
					{
						continue;
					};
					
					mapBinary[lodeX + iX][lodeY + iY] = m;
				}
			}
		}
	}
}

function generateCaves()
{
	noise.seed(Math.random());
	for (var x = 0; x < mapWidth; x++) 
	{
		for (var y = 0; y < mapHeight; y++) 
		{
			if(mapBinary[x][y] == undefined) continue;
			
			var value = Math.abs(noise.perlin2(x / 20, y / 20 ));
			
			var offset =  (y-100) / 700 * 0.20;
			offset = Math.min(0.20,offset);
			offset = Math.max(0,offset);
			value = (value < offset ? 1 : 0);
			
			
			var offset =   (y-400) / 500  * 0.15 + 0.15;
			offset = Math.min(0.30,offset);
			offset = Math.max(0.15,offset);
			
			
			var value2 = Math.abs(noise.perlin2(y / 50, x / 50 ));
			value2 = (value2 >= offset ? 1 : 0);
			
			
			var value_final = value && value2;
			
			if(value_final) delete mapBinary[x][y];
		}
	}
}
















// dessine la map sur le canvas
function drawMap()
{
	// instanciation de la zone de dessin
	imageData = c.createImageData(mapWidth, mapHeight);

	// effacement des pixels 
	c.clearRect(0,0,mapWidth,mapHeight);
	 
	// pour chaque colonne 
	for(i = 0; i < mapWidth; i++)
	{	
		// pour chaque ligne 
		for(j = 0; j < mapHeight; j++)
		{
			// si un materiaux existe, il est dessiné 
			if(mapBinary[i][j] != undefined) setPixel(imageData, i, j, materials[ mapBinary[i][j] ].rgb);
		}
	}
	
	// ajout de l'image à la scene
	c.putImageData(imageData, 0, 0);
}


// fonction d'attribution d'un code couleur à un pixel
function setPixel(imageData, x, y, rgba) 
{
    index = (x + y * imageData.width) * 4;
    imageData.data[index+0] = rgba.r;
    imageData.data[index+1] = rgba.g;
    imageData.data[index+2] = rgba.b;
    imageData.data[index+3] =  ( rgba.a == undefined ? 255 : rgba.a );
}


function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}


function getStats(renderTime)
{
	var stats = {};
	for(m in materials)
	{
		stats[m] = 0;
	}
	
	for(x in mapBinary)
	{
		for(y in mapBinary[x])
		{
			if(mapBinary[x][y] != undefined) stats[mapBinary[x][y]]++;
		}
	}
	
	c.font      = "bold 10px Verdana";
	c.fillStyle = "#FFFFFF";
	c.lineWidth = "10";
	c.strokeStyle = "#FFFFFF";
	
	var lineHeight = 12;
	var offset = 0;

	for(m in stats)
	{
		c.strokeText(m + ' : ' + Math.round(stats[m] / 10) / 100 + 'k', 5, 10 + lineHeight*offset);
		offset++;
	}
	c.strokeText(renderTime + 'ms', 5, 10 + lineHeight*offset);
	
	offset = 0;
	for(m in stats)
	{
		c.fillStyle = rgbToHex( materials[m].rgb.r, materials[m].rgb.g, materials[m].rgb.b);
		c.fillText(m + ' : ' + Math.round(stats[m] / 10) / 100 + 'k', 5, 10 + lineHeight*offset);
		offset++;
	}
	c.fillText(renderTime + 'ms', 5, 10 + lineHeight*offset);
	
}


