var mapSize=0;
var height;


/**
 * Iteratively generate terrain from numeric inputs
 * @param {number} n
 * @param {number} minX Minimum X value
 * @param {number} maxX Maximum X value
 * @param {number} minY Minimum Y value
 * @param {number} maxY Maximum Y value
 * @param {Array} vertexArray Array that will contain vertices generated
 * @param {Array} faceArray Array that will contain faces generated
 * @param {Array} normalArray Array that will contain normals generated
 * @return {number}
 */
function terrainFromIteration(n, minX,maxX,minY,maxY, vertexArray, faceArray,normalArray)
{

    height =new Array(n+1);
    for(i=0 ; i<=n ; i++){
        height[i]=new Array(n+1);
    }
    for(i=0;i<=n;i++)
        for(j=0;j<=n;j++)
            height[i][j]=0;

            
    height[0][0]=0.1;
    height[n][0]=0.1;
    height[0][n]=0.1;
    height[n][n]=0.1;
    
    mapSize = n;
    diamondSquare(mapSize);


    var deltaX=(maxX-minX)/n;
    var deltaY=(maxY-minY)/n;
    for(var i=0;i<=n;i++)
       for(var j=0;j<=n;j++)
       {
           vertexArray.push(minX+deltaX*j);
           vertexArray.push(minY+deltaY*i);
           vertexArray.push(height[j][i]);
           
           var normal = vec3.fromValues(minX+deltaX*j,minY+deltaY*i,height[j][i]);
           vec3.normalize(normal,normal);

           normalArray.push(normal[0]);
           normalArray.push(normal[1]);
           normalArray.push(normal[2]); 
       }

    var numT=0;
    for(var i=0;i<n;i++)
       for(var j=0;j<n;j++)
       {
           var vid = i*(n+1) + j;
           faceArray.push(vid);
           faceArray.push(vid+1);
           faceArray.push(vid+n+1);
           
           faceArray.push(vid+1);
           faceArray.push(vid+1+n+1);
           faceArray.push(vid+n+1);
           numT+=2;
       }
    return numT;
}
/**
 * Generates line values from faces in faceArray
 * @param {Array} faceArray array of faces for triangles
 * @param {Array} lineArray array of normals for triangles, storage location after generation
 */
function generateLinesFromIndexedTriangles(faceArray,lineArray)
{
    numTris=faceArray.length/3;
    for(var f=0;f<numTris;f++)
    {
        var fid=f*3;
        lineArray.push(faceArray[fid]);
        lineArray.push(faceArray[fid+1]);
        
        lineArray.push(faceArray[fid+1]);
        lineArray.push(faceArray[fid+2]);
        
        lineArray.push(faceArray[fid+2]);
        lineArray.push(faceArray[fid]);
    }
}

function diamondSquare(size)
{       
    var halfSize = size/2;
    if(halfSize<1)
        return;

    for(x=halfSize;x<mapSize;x+=size)
        for(y=halfSize;y<mapSize;y+=size)
        {
            square(x,y,halfSize);
        }
    
    for(x=0;x<=mapSize;x+=halfSize)
        for(y= (x+halfSize) %size ; y<=mapSize ; y+=size )
        {
            diamond(x,y,halfSize);
        }

    diamondSquare(halfSize);


}

function square(x,y,offset){
    height[x][y] = Math.random() * offset *0.01 + ( getArrayValue(x+offset,y+offset) + getArrayValue(x+offset,y-offset) + getArrayValue(x-offset,y+offset) + getArrayValue(x-offset,y-offset) )/4;
}

function diamond(x,y,offset){
    var scale = 0.005*offset;
    height[x][y] = Math.random() * offset * 0.01 + ( getArrayValue(x+offset,y) + getArrayValue(x-offset,y) + getArrayValue(x,y+offset) + getArrayValue(x,y-offset))/4;
}

function getArrayValue(x,y){
    /* if( x<0 || y<0 )
        return 0; */
    if(x<0 &&y<0)
        return height[mapSize+1+x][mapSize+1+y];
    else if(x<0 && y>=0)
         return height[mapSize+1+x][y%(mapSize+1)];
    else if(x>=0 && y<0)
        return height[x%(mapSize+1)][mapSize+1+y];
    else
        return height[x%(mapSize+1)][y%(mapSize+1)];
}

