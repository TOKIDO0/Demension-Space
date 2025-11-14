package com.example.entity;

import com.baomidou.mybatisplus.extension.activerecord.Model;
import lombok.Data;

@Data
public class MaterialRep extends Model<MaterialRep> {
    //项目id
    private long projectid;
    //材料单号
    private long materialid;
    //材料价格
    private Integer money;
    //材料名称
    private  String materialname;
    //供应商名称
    private String Supplyname;
    //材料总价格
    //private Integer materialmoney;
    //总材料价格
    //private Integer moneyinall;


}
