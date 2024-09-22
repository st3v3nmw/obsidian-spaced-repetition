#course/aws/developer-associate 

Welcome to this lesson. In this lesson, I'm going to cover DynamoDB Global Tables. 

[[Global Tables|Global tables]] is a fully managed solution for deploying a multi-region and multi-master database. When you create a global table, you specify the regions you want the table to be available in. And DynamoDB performs all the necessary tasks to create identical tables and propagate any ongoing changes to all of those tables. And changes can be made in any of those tables in any region that your global table is replicated to. So let's have a look at a diagram. 

We've got region A and region B and also region C here. We've got DynamoDB and our application server here and it's reading and writing data in the table. We can then have a replica of the DynamoDB table in each of the other regions as well. And we can perform read and writes to all of those tables and the changes will be replicated across the tables in each of these three regions. 

![[Pasted image 20240508134406.png]]

Global tables uses asynchronous replication. Global tables is therefore a multi-region, multi-master database. Each replica table stores the same set of data items. And you can use logic in the application layer to failover to a replica region as well. So that gives you really high availability and fault tolerance.

----


# Questions

In the context of AWS DynamoDB global tables, what does "multi master" mean?::Each replica of the DynamoDB table (in different AWS Regions) can serve both **read** and **write** requests independently.
<!--SR:!2024-08-24,62,250-->

