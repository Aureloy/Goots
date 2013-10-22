materials = {

	grass : 
	{
		avgHeight: 50
		,minOffset : 10
		,maxOffset : 10
		
		,height_variation_factor : 10
		,mountain_factor : 15
		
		,noise_factor : 0.3
		,noise_height : 1
		
		,rgb : { r: 0, g : 150, b : 0}
		
		,previousMaterial : false
	}
	
	,mud : 
	{
		avgHeight: 60
		,minOffset : 15
		,maxOffset : 20
		
		,height_variation_factor : 5
		,mountain_factor : 5
		
		,previousMaterial : "grass"

		,noise_factor : 0.7
		,noise_height : 1
		
		,rgb : { r: 150, g : 75, b : 0}
	}
	
	,dirt : 
	{
		avgHeight: 130
		,minOffset : 45
		,maxOffset : 100
		
		,height_variation_factor : 10
		,mountain_factor : 5
		
		,previousMaterial : "mud"
		
		,noise_factor : 0.7
		,noise_height : 1
		
		,rgb : { r: 75, g : 50, b : 50}
	}
	,stone :
	{
		avgHeight: 999
		,minOffset : 0
		,maxOffset : 0
		
		,height_variation_factor : 0
		,mountain_factor : 0
		
		,previousMaterial : "dirt"
		
		,noise_factor : 0
		,noise_height : 0
		
		,rgb : { r: 50, g : 25, b : 25}
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
	
	for(m in materials)
	{
		mat = materials[m];
		newHeight[m] = mat.avgHeight
			+ Math.round( Math.random() * mat.height_variation_factor )
			* ( Math.random() > 0.5 ? 1 : - 1 );
	}
		
	for(i = 0; i < width; i++)
	{
		mapBinary[i] = new Array();
		
		for(m in materials)
		{
			mat = materials[m];
			newHeight[m] += Math.floor(Math.pow( Math.random(), mat.mountain_factor) * mat.height_variation_factor) 
				* ( newHeight[m] < ( mat.avgHeight - mat.minOffset ) ? 1 : ( newHeight[m] > ( mat.avgHeight + mat.maxOffset ) ? - 1 : (Math.random() > 0.5 ? 1 : - 1 ) ) )
				+ ( Math.random() < mat.noise_factor ? (Math.random() > 0.5 ? 1 : - 1 ) * mat.noise_height : 0 );
		}
		for(m in materials)
		{
			previousHeight[m] = getPreviousMaterialsHeight(m, newHeight);
		}
		
		for(j = 0; j < height; j++)
		{
			for(m in materials)
			{
				previousMaterialHeight = previousHeight[m];
				
				if( previousMaterialHeight == 0 && j < newHeight[m] || 
					j <= previousMaterialHeight ||
					j > ( newHeight[m] + previousMaterialHeight ) ) continue;
				
				mapBinary[i][j] = m;
				break;
			}
		}
	}
	
	drawMap();
}

