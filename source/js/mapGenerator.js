materials = {

	1 : 
	{
		name : 'grass'
		,thickness: 200
		,minOffset : 170
		,maxOffset : 200
		
		,height_variation_factor : 6
		,plateau_factor : 15
		,smoothness : 0.2
		
		,noise_factor : 0.3
		,noise_height : 1
		
		,rgb : { r: 0, g : 150, b : 0}
		
		,dependency : false
		
		,lodes : {
			size : 0
			,amountPercent : 0
			,spreadOffset : 0
		}
	}
	
	,2 : 
	{
		name : 'mud'
		,thickness: 25
		,minOffset : 20
		,maxOffset : 30
		
		,height_variation_factor : 3
		,plateau_factor : 1
		,smoothness : 0.3
		
		,dependency : 1

		,noise_factor : 0.1
		,noise_height : 1
		
		,rgb : { r: 150, g : 75, b : 0}
		
		,lodes : {
			size : 20
			,amountPercent : 0.3
			,spreadOffset : 100
		}
	}
	
	,3 : 
	{
		name : 'dirt'
		,thickness: 50
		,minOffset : 45
		,maxOffset : 100
		
		,height_variation_factor : 10
		,plateau_factor : 10
		,smoothness : 0.8
		
		,dependency : 2
		
		,noise_factor : 0.7
		,noise_height : 1
		
		,rgb : { r: 75, g : 50, b : 50}
		
		,lodes : {
			size : 15
			,amountPercent : 0.5
			,spreadOffset : 150
		}
	}
	,4 :
	{
		name : 'stone'
		,thickness: 120
		,minOffset : 50
		,maxOffset : 50
		
		,height_variation_factor : 8
		,plateau_factor : 5
		,smoothness : 0
		
		,dependency : 3
		
		,noise_factor : 0.7
		,noise_height : 1
		
		,rgb : { r: 50, g : 25, b : 25}
		
		,lodes : {
			size : 25
			,amountPercent : 1
			,spreadOffset : 200
		}
	}
	,5 :
	{
		name : 'darkstone'
		,thickness: 250
		,minOffset : 0
		,maxOffset : 0
		
		,height_variation_factor : 5
		,plateau_factor : 1
		,smoothness : 0.5
		
		,dependency : 4
		
		,noise_factor : 0.5
		,noise_height : 1
		
		,rgb : { r: 25, g : 10, b : 10}
		
		,lodes : {
			size : 20
			,amountPercent : 0.6
			,spreadOffset : 250
		}
	}
	,6 :
	{
		name : 'granit'
		,thickness: 1200
		,minOffset : 0
		,maxOffset : 0
		
		,height_variation_factor : 0
		,plateau_factor : 0
		,smoothness : 0
		
		,dependency : 5
		
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
			alert('Map enregistr�e');
		}
		catch (e) 
		{
			delete localStorage.map;
			alert('Map non enregistr�e : d�passement de m�moire');
		}
	});


	$('#loadMap').click(function(){

		if(localStorage.map == undefined || !localStorage.map)	
		{
			alert("Aucune map trouv�e en m�moire");
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
		alert('Map effac�e de la m�moire');
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
	
	// d�finition de la hauteur initiale de chaque materiau ( colonne de gauche )
	generateMaterialInitHeight();
	
	// 1ere it�ration : hauteur des mat�riaux
	generateMaterialHeightByColumn();
	
	// 2eme it�ration : veines de mat�riaux
	 generateLodes();
	
	// 3eme it�ration : caves
	generateCaves();
	
	// une fois la map g�n�r�e, on la dessine
	drawMap();
	
	var end = Date.now();

	getStats(end - start);
}





function generateMaterialHeightByColumn()
{
	// pour chaque colonne	
	for(x = 0; x < mapWidth; x++)
	{
		mapBinary[x] = new Object();
		
		// calcul de la hauteur des diff�rents mat�riaux
		generateMaterialsHeight();
		
		// on place dans un buffer la hauteur calcul�e, pour la prochaine it�ration
		oldParentMaterialsHeight = parentMaterialsHeight;
		
		// on attribue le mat�riau � chaque pixel en fonction de la hauteur des diff�rents materiaux calcul�s
		setColumnMaterial(x);
	}
}


// calcule la hauteur initiale des mat�riaux sur la 1ere colonne
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

// calcule la hauteur des diff�rentes couches de mat�riaux sur une colonne
function generateMaterialsHeight()
{
	// pour chaque mat�riaux
	for(m in materials)
	{
		mat = materials[m];
		
		// on r�cup�re la hauteur pr�c�dente afin de garder une continuit� dans le paysage
		parentMaterialsHeight[m] = getDependencyHeight(m, newMaterialsHeight);
		 
		// si le materiau doit changer de taille
		if(mat.smoothness == 0 || Math.random() > mat.smoothness || oldParentMaterialsHeight[m] == undefined )
		{
			// on g�n�re une nouvelle hauteur	// en fonction de la variation
			newMaterialsHeight[m] += Math.floor(Math.pow( Math.random(), mat.plateau_factor) * mat.height_variation_factor) 
				// on v�rifie qu'elle de sorte pas du cadre de restriction
				* ( newMaterialsHeight[m] < ( mat.thickness - mat.minOffset ) ? 1 : ( newMaterialsHeight[m] > ( mat.thickness + mat.maxOffset ) ? - 1 : (Math.random() > 0.5 ? 1 : - 1 ) ) )
				// et ajoute du bruit pour la variation
				+ ( Math.random() < mat.noise_factor ? (Math.random() > 0.5 ? 1 : - 1 ) * mat.noise_height : 0 );
		}
		else
		{
			// sinon le mat�riau reste � la m�me hauteur que pr�c�demment, avec la contrainte de respet du mat�riau parent.
			newMaterialsHeight[m] -= parentMaterialsHeight[m] - oldParentMaterialsHeight[m];
		}
	}
}



// fonction r�cursive qui retourne la hauteur des mat�riaux parents 
function getDependencyHeight(m, newMaterialsHeight)
{
	return ( materials[m].dependency != false ? newMaterialsHeight[materials[m].dependency] + getDependencyHeight(materials[m].dependency, newMaterialsHeight) : 0 );
}


// fonction qui alloue tous les pixels d'une colonne en fonction des mat�riaux calcul�s
function setColumnMaterial(x)
{
	for(m in materials)
	{
		// point de d�part : si pas de mat�riau parent, on d�marre � la hauteur du materiau, sinon on rempli depuis le parent + 1
		var startPoint = ( oldParentMaterialsHeight[m] == 0 ? newMaterialsHeight[m] : oldParentMaterialsHeight[m] + 1) ;
		// point d'arriv�e : le minimum entre la hauteur calcul�e et les limite de la map
		var endPoint = Math.min( newMaterialsHeight[m] + oldParentMaterialsHeight[m], mapHeight );
		
		for(y = startPoint; y <= endPoint; y++)
		{
			mapBinary[x][y] = m;
		}
	}
}





// fonction qui dessine des poches de mat�riaux 

function generateLodes()
{
	// pour chaque materiau
	for(m in materials)
	{
		// on d�termine le nombre de veines � placer sur la map
		var lodeNumber = Math.round(materials[m].lodes.amountPercent * mapHeight * 2);
		if(!lodeNumber) continue;
		
		// on d�termine une hauteur moyenne du materiau
		var averageY = getDependencyHeight(m, initialMaterialsHeight);
		
		// pour chaque veine
		for(i = 0; i <= lodeNumber; i++)
		{
			noise.seed(Math.random());
			
			// on d�termine une position de d�part en fonction de la largeur de la map
			lodeX = Math.round(Math.random() * mapWidth + 1);
			// on d�termine une position de d�part en fonction de la hauteur de la couche et du coefficient de spread
			lodeY = averageY + (Math.random() > 0.2 ? 1 : -1 ) * Math.round( Math.random() * materials[m].lodes.spreadOffset / 2 + 1);
			
			squareSize = Math.round(materials[m].lodes.size / 2);
			
			iXMin = lodeX - squareSize;
			iXMax = lodeX + squareSize;
			
			iYMin = lodeY - squareSize;
			iYMax = lodeY + squareSize;
			
			for(iX = iXMin; iX <= iXMax; iX++)
			{
				for(iY = iYMin; iY <= iYMax; iY++)
				{
					// out of bounds
					if(mapBinary[iX] == undefined)
					{
						continue;
					}
					
					// out of bounds ou dans le ciel
					if(mapBinary[iX][iY] == undefined)
					{
						continue;
					}
					
					// on force une couche de v�g�tation en haut //
					if(mapBinary[iX][iY] == m)
					{
						continue;
					}

					// on force une couche de v�g�tation en haut //
					if(mapBinary[iX][iY] == 1)
					{
						continue;
					}
					
					
					var active = Math.abs(noise.perlin2((iX - lodeX) / 13, (iY - lodeY) / 13 ));
					active = (active > 0.50 ? 1 : 0);
					
					if(!active)
					{
						continue;
					};
					
					mapBinary[iX][iY] = m;
				}
			}
		}
	}
}

function generateCaves()
{
	noise.seed(Math.random());
			
	for (x = 0; x < mapWidth; x++) 
	{
		if(mapBinary[x] == undefined) continue;
		
		for (y = 0; y < mapHeight; y++) 
		{
			if(mapBinary[x][y] == undefined) continue;
			if(mapBinary[x][y] == 1) continue; // grass security
			
			var value = Math.abs(noise.perlin2(x / 20, y / 20 ));
			
			var offset =  (y-100) / 700 * 0.20;
			offset = Math.min(0.20,offset);
			offset = Math.max(0,offset);
			value = (value < offset ? 1 : 0);
			
			if(!value) continue;
			
			var offset =   (y-400) / 500  * 0.15 + 0.15;
			offset = Math.min(0.30,offset);
			offset = Math.max(0.15,offset);
			
			var value2 = Math.abs(noise.perlin2(y / 50, x / 50 ));
			value2 = (value2 >= offset ? 1 : 0);
			
			if(!value2) continue;
			
			delete mapBinary[x][y];
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
		if(mapBinary[i] == undefined) continue;
		
		// pour chaque ligne 
		for(j = 0; j < mapHeight; j++)
		{
			// si un materiaux existe, il est dessin� 
			if(mapBinary[i][j] != undefined) setPixel(imageData, i, j, materials[ mapBinary[i][j] ].rgb);
		}
	}
	
	// ajout de l'image � la scene
	c.putImageData(imageData, 0, 0);
}


// fonction d'attribution d'un code couleur � un pixel
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
		c.strokeText(materials[m].name + ' : ' + Math.round(stats[m] / 10) / 100 + 'k', 5, 10 + lineHeight*offset);
		offset++;
	}
	c.strokeText(renderTime + 'ms', 5, 10 + lineHeight*offset);
	
	offset = 0;
	for(m in stats)
	{
		c.fillStyle = rgbToHex( materials[m].rgb.r, materials[m].rgb.g, materials[m].rgb.b);
		c.fillText(materials[m].name + ' : ' + Math.round(stats[m] / 10) / 100 + 'k', 5, 10 + lineHeight*offset);
		offset++;
	}
	c.fillText(renderTime + 'ms', 5, 10 + lineHeight*offset);
	
}


