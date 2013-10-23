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
	}
};



function init()
{
	element = document.getElementById("map");
	c = element.getContext("2d");

	width = element.width;
	height = element.height;
	
	
	$('#storeMap').click(function(){

		alert('Map enregistrée');
		localStorage.map = JSON.stringify(mapBinary);
	});


	$('#loadMap').click(function(){

		if(localStorage.map == undefined || !localStorage.map)	
		{
			alert("Aucune map trouvée en mémoire");
			return false;
			
		}
		mapBinary = JSON.parse(localStorage.map); // TODO : choisir une façon de sauvegarder la map. Localstorage = string
		drawMap();
	});

	$('#generateMap').click(function(){
		map();
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


function setPixel(imageData, x, y, rgba) 
{
    index = (x + y * imageData.width) * 4;
    imageData.data[index+0] = rgba.r;
    imageData.data[index+1] = rgba.g;
    imageData.data[index+2] = rgba.b;
    imageData.data[index+3] =  ( rgba.a == undefined ? 255 : rgba.a );
}


function getPreviousMaterialsHeight(m, newHeight)
{
	return ( materials[m].previousMaterial != false ? newHeight[materials[m].previousMaterial] + getPreviousMaterialsHeight(materials[m].previousMaterial, newHeight) : 0 );
}



function drawMap()
{
	
	imageData = c.createImageData(width, height);

	c.clearRect(0,0,width,height);
	 
	for(i = 0; i < width; i++)
	{	
		for(j = 0; j < height; j++)
		{
			if(mapBinary[i][j] != undefined) setPixel(imageData, i, j, materials[ mapBinary[i][j] ].rgb);
		}
	}
	
	c.putImageData(imageData, 0, 0);
}


var mapBinary = false;

function map()
{
	mapBinary = new Object();
	newHeight = new Object();
	previousHeight = new Object();
	oldMdh  = new Object();
	
	for(m in materials)
	{
		mat = materials[m];
		newHeight[m] = mat.thickness
			+ Math.round( Math.random() * mat.height_variation_factor )
			* ( Math.random() > 0.5 ? 1 : - 1 );
	}
		
	for(x = 0; x < width; x++)
	{
		mapBinary[x] = new Array();
		
		for(m in materials)
		{
			mat = materials[m];
			previousHeight[m] = getPreviousMaterialsHeight(m, newHeight);
			 
			if(mat.smoothness == 0 || Math.random() > mat.smoothness || oldMdh[m] == undefined )
			{
				newHeight[m] += Math.floor(Math.pow( Math.random(), mat.plateau_factor) * mat.height_variation_factor) 
					* ( newHeight[m] < ( mat.thickness - mat.minOffset ) ? 1 : ( newHeight[m] > ( mat.thickness + mat.maxOffset ) ? - 1 : (Math.random() > 0.5 ? 1 : - 1 ) ) )
					+ ( Math.random() < mat.noise_factor ? (Math.random() > 0.5 ? 1 : - 1 ) * mat.noise_height : 0 );
			}
			else
			{
				diff = previousHeight[m] - oldMdh[m];
				newHeight[m] = newHeight[m] - diff;
			}
		}
		
		for(y = 0; y < height; y++)
		{
			for(m in materials)
			{
					oldMdh[m] = previousMaterialHeight = previousHeight[m];
					
					if(  previousMaterialHeight == 0 && y < newHeight[m] ||
							y <= previousMaterialHeight ||
							y > ( newHeight[m] + previousMaterialHeight ) ) continue;
					
					mapBinary[x][y] = m;
					break;
			}
		}
	}
	
	drawMap();
}

