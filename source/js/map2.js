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
			,amountPercent : 0.03
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
			,amountPercent : 0.05
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
			,amountPercent : 0.15
			,spreadOffset : 200
		}
	}
	,darkstone :
	{
		thickness: 250
		,minOffset : 0
		,maxOffset : 0
		
		,height_variation_factor : 15
		,plateau_factor : 1
		,smoothness : 0
		
		,previousMaterial : "stone"
		
		,noise_factor : 1
		,noise_height : 2
		
		,rgb : { r: 25, g : 10, b : 10}
		
		,lodes : {
			size : 20
			,amountPercent : 0.06
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
		
		,rgb : { r: 10, g : 5, b : 5}
		
		,lodes : {
			size : 20
			,amountPercent : 0.05
			,spreadOffset : 500
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
	// instanciation des variables de fonctionnement 
	
	mapBinary = new Object();
	initialMaterialsHeight = new Object();
	newMaterialsHeight = new Object();
	parentMaterialsHeight = new Object();
	oldParentMaterialsHeight  = new Object();
	
	// d�finition de la hauteur initiale de chaque materiau ( colonne de gauche )
	generateMaterialInitHeight();
	
	// pour chaque colonne	
	for(x = 0; x < mapWidth; x++)
	{
		mapBinary[x] = new Array();
		
		// calcul de la hauteur des diff�rents mat�riaux
		generateMaterialsHeight();
		
		// on place dans un buffer la hauteur calcul�e, pour la prochaine it�ration
		oldParentMaterialsHeight = parentMaterialsHeight;
		
		// on attribue le mat�riau � chaque pixel en fonction de la hauteur des diff�rents materiaux calcul�s
		setColumnMaterial(x);
	}
	
	
	
	// 2eme it�ration : veines de mat�riaux
	generateLodes();
	
	// une fois la map g�n�r�e, on la dessine
	drawMap();
	
	
	getStats();
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
		parentMaterialsHeight[m] = getParentMaterialsHeight(m, newMaterialsHeight);
		 
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
function getParentMaterialsHeight(m, newMaterialsHeight)
{
	return ( materials[m].previousMaterial != false ? newMaterialsHeight[materials[m].previousMaterial] + getParentMaterialsHeight(materials[m].previousMaterial, newMaterialsHeight) : 0 );
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
		var lodeNumber = materials[m].lodes.amountPercent * mapHeight;
		if(!lodeNumber) continue;
		
		// on d�termine la hauteur moyenne du materiau
		var averageY = getParentMaterialsHeight(m, initialMaterialsHeight);
		
		// pour chaque veine
		for(i = 0; i <= lodeNumber; i++)
		{
			// on d�termine une position de d�part en fonction de la largeur de la map
			lodeX = Math.round(Math.random() * mapWidth + 1);
			// on d�termine une position de d�part en fonction de la hauteur de la couche et du coefficient de spread
			lodeY = averageY + (Math.random() > 0.2 ? 1 : -1 ) * Math.round( Math.random() * materials[m].lodes.spreadOffset / 2 + 1);
			
			// algo a d�terminer pour faire une poche r�aliste
			lineLengthX = new Array();
			lineLengthY = new Array();
			
			squareSize = Math.round(materials[m].lodes.size/2);
			
			for(iX = -squareSize; iX <= squareSize; iX++)
			{
				lineLengthX[iX] = Math.round(Math.random() * squareSize + 1);
			}
			
			for(iY = -squareSize; iY <= squareSize; iY++)
			{
				lineLengthY[iY] = Math.round(Math.random() * squareSize + 1);
			}
			
			for(iX = -squareSize; iX <= squareSize; iX++)
			{
				for(iY = -squareSize; iY <= squareSize; iY++)
				{
					// algo a d�terminer
					// if(Math.abs(iX) > lineLengthX[iX] || Math.abs(iY) > Math.abs(lineLengthY[iY]))
					// {
						// continue;
					// }
					
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
					
					// ne fonctionne pas !! //
					if(mapBinary[lodeX + iX][lodeY + iY] == "grass")
					{
						continue;
					}
					
					mapBinary[lodeX + iX][lodeY + iY] = m;
				}
			}
			
		}
		
		// on d�termine une matrice plus ou moins large en fonction du parametre size
		
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


function getStats()
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
	
	var lineHeight = 12;
	var offset = 0;
	for(m in stats)
	{
		c.strokeStyle = "#FFFFFF";
		c.lineWidth = "10";
		c.strokeText(m + ' : ' + Math.round(stats[m] / 10) / 100 + 'k', 5, 10 + lineHeight*offset);
		offset++;
	}
	
	offset = 0;
	for(m in stats)
	{
		c.fillStyle = rgbToHex( materials[m].rgb.r, materials[m].rgb.g, materials[m].rgb.b);
		c.fillText(m + ' : ' + Math.round(stats[m] / 10) / 100 + 'k', 5, 10 + lineHeight*offset);
		offset++;
	}
	
	
}


