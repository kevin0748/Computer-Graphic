var mapSize=0;
var height;
var minHeight=10;
var maxHeight=-10;


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
           normalArray.push (0);
           normalArray.push (0);
           normalArray.push (0); 
       }

    var numT=0;
    for(var i=0;i<n;i++)
       for(var j=0;j<n;j++)
       {
           var vid = i*(n+1) + j;
           faceArray.push(vid);
           faceArray.push(vid+1);
           faceArray.push(vid+n+1);
           
           var n1 = vid;
           var n2 = vid+1;
           var n3 = vid+n+1;
           var v1 = vec3.fromValues(vertexArray[n1*3],vertexArray[n1*3+1],vertexArray[n1*3+2]);
           var v2 = vec3.fromValues(vertexArray[n2*3],vertexArray[n2*3+1],vertexArray[n2*3+2]);
           var v3 = vec3.fromValues(vertexArray[n3*3],vertexArray[n3*3+1],vertexArray[n3*3+2]);

           var v2v1 = vec3.create();
           var v3v1 = vec3.create();
           var nv   = vec3.create();
           vec3.subtract(v2v1,v2,v1);
           vec3.subtract(v3v1,v3,v1);
           vec3.cross(nv , v2v1 , v3v1);
           vec3.normalize(nv,nv);
           normalArray[n1*3] = nv[0];
           normalArray[n1*3+1] = nv[1];
           normalArray[n1*3+2] = nv[2];
           normalArray[n2*3] = nv[0];
           normalArray[n2*3+1] = nv[1];
           normalArray[n2*3+2] = nv[2];
           normalArray[n3*3] = nv[0];
           normalArray[n3*3+1] = nv[1];
           normalArray[n3*3+2] = nv[2];


           
           faceArray.push(vid+1);
           faceArray.push(vid+1+n+1);
           faceArray.push(vid+n+1);

           n1 = vid+1;
           n2 = vid+1+n+1;
           n3 = vid+n+1;
           v1 = vec3.fromValues(vertexArray[n1*3],vertexArray[n1*3+1],vertexArray[n1*3+2]);
           v2 = vec3.fromValues(vertexArray[n2*3],vertexArray[n2*3+1],vertexArray[n2*3+2]);
           v3 = vec3.fromValues(vertexArray[n3*3],vertexArray[n3*3+1],vertexArray[n3*3+2]);

           vec3.subtract(v2v1,v2,v1);
           vec3.subtract(v3v1,v3,v1);
           vec3.cross(nv , v2v1 , v3v1);
           vec3.normalize(nv,nv);
           normalArray[n1*3] = nv[0];
           normalArray[n1*3+1] = nv[1];
           normalArray[n1*3+2] = nv[2];
           normalArray[n2*3] = nv[0];
           normalArray[n2*3+1] = nv[1];
           normalArray[n2*3+2] = nv[2];
           normalArray[n3*3] = nv[0];
           normalArray[n3*3+1] = nv[1];
           normalArray[n3*3+2] = nv[2];

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

/**
 * Use the diamond square algorithm to calculate the value of the terrain height.
 * @param {number} size the length of the square which is used in the algorithm.
 */
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

/**
 * Square part in the algorithm
 * @param {number} x the x of the square center
 * @param {number} y the y of the square center
 * @param {number} offset the offset from the (x,y) point
 */
function square(x,y,offset){
    height[x][y] = Math.random() * offset *0.006 * (Math.random()>0.5 ? 1 : -1) + average( [getArrayValue(x+offset,y+offset), getArrayValue(x+offset,y-offset) ,getArrayValue(x-offset,y+offset) , getArrayValue(x-offset,y-offset)] );
}

/**
 * Diamond part in the algorithm
 * @param {number} x the x of the diamond center
 * @param {number} y the y of the diamond center
 * @param {number} offset the offset from the (x,y) point
 */
function diamond(x,y,offset){
    height[x][y] = Math.random() * offset * 0.006 * (Math.random()>0.5 ? 1 : -1) + average([ getArrayValue(x+offset,y) , getArrayValue(x-offset,y) , getArrayValue(x,y+offset) , getArrayValue(x,y-offset)]);
}

/**
 * Return the array average value
 * @param {array} values 
 */
function average(values)
{
    var sum=0;
    var count=4;
    for(i=0;i<values.length;i++){
        if(values[i]==-1)
        {
            count--;
            continue;
        }
        sum += values[i];
    }

    return sum/count;
}

function getArrayValue(x,y){
    if( x<0 || y<0 || x>mapSize || y>mapSize)
        return -1;
    else
        return height[x][y];
}

function setMinMaxHeight()
{
    var min=10;
    var max=-10;
    for(i=0;i<height.length;i++)
      for(j=0;j<height.length;j++)
      {
        if(height[i][j]>max)
          max = height[i][j];
        if(height[i][j]<min)
          min = height[i][j];
      }

    minHeight = min;
    maxHeight = max;

    console.log(min);
    console.log(max);
}

function getMin(){
    return minHeight;
}

function getMax(){
    return maxHeight;
}

function getHeightArray(){
    return height;
}